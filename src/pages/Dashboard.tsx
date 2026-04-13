import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PensieveCard } from "@/components/pensieve/PensieveCard";
import { MonoLabel } from "@/components/pensieve/MonoLabel";
import { ThemeChip } from "@/components/pensieve/ThemeChip";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Flame, Loader2 } from "lucide-react";

/* ── Types ── */
interface EntryData {
  id: string;
  content: string;
  entry_date: string;
  word_count: number | null;
  created_at: string;
  updated_at: string;
}

/* ── Helpers ── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning. The mind is freshest now.";
  if (h < 17) return "Afternoon. How has the day been treating you?";
  if (h < 21) return "Evening. Time to untangle the day.";
  return "Still awake. Something on your mind?";
};

const moodOptions = [
  { id: "heavy", label: "Heavy", prompt: "Heavy days are worth writing about too." },
  { id: "clouded", label: "Clouded", prompt: "Let the fog clear through writing." },
  { id: "neutral", label: "Neutral", prompt: "Sometimes the quietest days hold the most." },
  { id: "clear", label: "Clear", prompt: "Clarity is worth capturing." },
  { id: "bright", label: "Bright", prompt: "Something bright happened?" },
];

/* ── Simple keyword-based emotion detection (client side, lightweight) ── */
const emotionKeywords: Record<string, string[]> = {
  joy: ["happy", "joy", "grateful", "gratitude", "excited", "bright", "light", "laugh", "love", "warm", "peaceful", "calm", "proud", "delight", "cheerful", "wonderful", "content", "relieved"],
  sadness: ["sad", "grief", "heavy", "tears", "crying", "miss", "lonely", "loss", "pain", "hurt", "sorrow", "melancholy", "nostalgic", "empty"],
  anxiety: ["anxious", "anxiety", "worry", "nervous", "fear", "dread", "panic", "spiral", "insomnia", "overwhelm", "stress", "racing", "tight", "tense"],
  anger: ["angry", "anger", "frustrate", "furious", "rage", "annoy", "bitter", "resentm", "jealous", "snap"],
  growth: ["growth", "learn", "progress", "realize", "understand", "clarity", "insight", "therapy", "breakthrough", "awareness", "pattern", "healing"],
  reflection: ["reflect", "think", "journal", "writing", "notice", "observe", "explore", "question", "wonder", "consider", "meaning"],
  connection: ["friend", "family", "conversation", "together", "love", "trust", "vulnerable", "share", "support", "relationship", "sister", "brother", "mom", "dad", "colleague"],
};

function detectEmotion(text: string): string {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    scores[emotion] = keywords.reduce((acc, kw) => {
      const regex = new RegExp(kw, "gi");
      const matches = lower.match(regex);
      return acc + (matches ? matches.length : 0);
    }, 0);
  }
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return "neutral";
  return Object.entries(scores).find(([_, v]) => v === maxScore)?.[0] || "neutral";
}

const emotionColors: Record<string, string> = {
  joy: "hsl(45, 60%, 50%)",
  sadness: "hsl(220, 40%, 45%)",
  anxiety: "hsl(280, 35%, 50%)",
  anger: "hsl(0, 50%, 45%)",
  growth: "hsl(140, 40%, 45%)",
  reflection: "hsl(200, 30%, 50%)",
  connection: "hsl(170, 40%, 45%)",
  neutral: "hsl(0, 0%, 35%)",
};

/* ── Extract themes from entry content ── */
function extractThemes(entries: EntryData[]): { label: string; count: number; desc: string }[] {
  const themeKeywords: Record<string, { desc: string, keys: string[] }> = {
    "Self-reflection": { desc: "Observational awareness of one's own thoughts and behaviors", keys: ["reflect", "journal", "writing", "notice", "awareness", "pattern", "observe"] },
    "Anxiety & Fear": { desc: "Anticipatory dread or physiological response to perceived threats", keys: ["anxious", "anxiety", "worry", "fear", "dread", "panic", "nervous", "insomnia", "spiral"] },
    "Growth & Healing": { desc: "Integration of past challenges and expansion of psychological capacity", keys: ["growth", "progress", "heal", "therapy", "breakthrough", "learn", "change"] },
    "Relationships": { desc: "Interpersonal dynamics, boundaries, and emotional bonds with others", keys: ["friend", "family", "mom", "dad", "sister", "colleague", "conversation", "relationship", "connection"] },
    "Purpose & Meaning": { desc: "Existential questioning and value-aligned action making", keys: ["purpose", "meaning", "search", "identity", "who am i", "direction", "decision"] },
    "Gratitude": { desc: "Active appreciation for present moment conditions or external gifts", keys: ["grateful", "gratitude", "thankful", "appreciate", "lucky", "blessed"] },
    "Boundaries": { desc: "Psychological limits establishing what is acceptable in terms of behavior", keys: ["boundary", "boundaries", "no", "protect", "limit", "self-care"] },
    "Creativity": { desc: "Expressive flow states and non-linear problem solving", keys: ["poem", "wrote", "creative", "art", "music", "book", "read"] },
  };

  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const lower = entry.content.toLowerCase();
    for (const [theme, data] of Object.entries(themeKeywords)) {
      for (const kw of data.keys) {
        if (lower.includes(kw)) {
          counts[theme] = (counts[theme] || 0) + 1;
          break; // count each entry only once per theme
        }
      }
    }
  }

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count, desc: themeKeywords[label].desc }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

/* ── Compute streak ── */
function computeStreak(entries: EntryData[]): number {
  if (entries.length === 0) return 0;
  const dates = new Set(entries.map(e => e.entry_date));
  let streak = 0;
  const d = new Date();
  // Check if today has an entry, if not start from yesterday
  const todayStr = d.toISOString().split("T")[0];
  if (!dates.has(todayStr)) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const ds = d.toISOString().split("T")[0];
    if (dates.has(ds)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/* ── Dashboard Page ── */
const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = text.length;
  const moodPrompt = moodOptions.find(m => m.id === mood)?.prompt || "What's alive in you today?";

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 200) + "px"; }
  }, []);

  /* ── Fetch all entries on mount ── */
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const data = await apiFetch("/entries?page=1&page_size=100");
        setEntries(data.entries || []);
      } catch (err: any) {
        console.error("Failed to fetch entries:", err);
        // If unauthorized, still show empty dashboard
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);

  /* ── Computed values from real entries ── */
  const streak = useMemo(() => computeStreak(entries), [entries]);
  const totalWords = useMemo(() => entries.reduce((acc, e) => acc + (e.word_count || 0), 0), [entries]);

  /* ── Heatmap: 90 days of real data ── */
  const heatmapData = useMemo(() => {
    const entryMap = new Map<string, { count: number; words: number }>();
    for (const entry of entries) {
      const dateStr = entry.entry_date;
      const existing = entryMap.get(dateStr);
      if (existing) {
        existing.count++;
        existing.words += entry.word_count || 0;
      } else {
        entryMap.set(dateStr, {
          count: 1,
          words: entry.word_count || 0,
        });
      }
    }

    return Array.from({ length: 90 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (89 - i));
      // Fix timezone offset so local day matches DB string format (YYYY-MM-DD):
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      const dateStr = d.toISOString().split("T")[0];
      const data = entryMap.get(dateStr);
      return {
        date: d,
        dateStr,
        hasEntry: !!data,
        words: data?.words || 0,
        intensity: data ? Math.min(data.words / 300, 1) : 0, // normalize: 300 words = full intensity
      };
    });
  }, [entries]);

  /* ── Weekly rhythm: day-of-week word distribution ── */
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekData = useMemo(() => {
    const dayWords: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const dayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    for (const entry of entries) {
      const dayIndex = new Date(entry.entry_date).getDay(); // 0=Sun
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Make Mon=0
      dayWords[adjustedIndex] += entry.word_count || 0;
      dayCounts[adjustedIndex]++;
    }

    const today = new Date().getDay();
    const todayAdjusted = today === 0 ? 6 : today - 1;

    return weekDays.map((d, i) => ({
      day: d,
      words: dayWords[i],
      entryCount: dayCounts[i],
      isToday: i === todayAdjusted,
    }));
  }, [entries]);

  const bestDay = useMemo(() => {
    const max = weekData.reduce((max, cur, i, arr) => cur.words > arr[max].words ? i : max, 0);
    return weekDays[max];
  }, [weekData]);

  /* ── Peak writing hour ── */
  const peakHour = useMemo(() => {
    const hourCounts: Record<number, number> = {};
    for (const entry of entries) {
      const h = new Date(entry.created_at).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    }
    const maxHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    if (!maxHour) return null;
    const h = parseInt(maxHour[0]);
    return h >= 21 ? "after 9pm" : h >= 18 ? "in the evening" : h >= 12 ? "in the afternoon" : h >= 6 ? "in the morning" : "late at night";
  }, [entries]);

  /* ── Themes ── */
  const themes = useMemo(() => extractThemes(entries), [entries]);

  /* ── Emotional drift (SVG path from chronological emotion data) ── */
  const { driftPath, driftFillPath, emotionAnnotations, driftMonths } = useMemo(() => {
    if (entries.length < 2) return { driftPath: "", driftFillPath: "", emotionAnnotations: [], driftMonths: [] };

    const sorted = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));

    // Map emotions to y-values (lower = more positive, GitHub-style)
    const emotionY: Record<string, number> = {
      joy: 25, growth: 40, connection: 45, reflection: 60,
      neutral: 80, anxiety: 100, sadness: 115, anger: 130,
    };

    const points = sorted.map((entry, i) => {
      const x = (i / (sorted.length - 1)) * 800;
      const emotion = detectEmotion(entry.content);
      const y = emotionY[emotion] || 80;
      return { x, y, emotion, date: entry.entry_date };
    });

    // Smoothed SVG path using bezier curves
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }

    const fillPath = path + ` L800,160 L0,160 Z`;

    // Annotations: find significant emotional peaks
    const annotations: { x: number; y: number; label: string }[] = [];
    const significantEmotions = ["joy", "sadness", "anger", "growth"];
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i];
      if (significantEmotions.includes(p.emotion) && p.emotion !== points[i - 1].emotion) {
        if (annotations.length < 3 && (!annotations.length || Math.abs(annotations[annotations.length - 1].x - p.x) > 100)) {
          const d = new Date(p.date);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          annotations.push({ x: p.x, y: p.y, label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
        }
      }
    }

    // Month labels
    const firstDate = new Date(sorted[0].entry_date);
    const lastDate = new Date(sorted[sorted.length - 1].entry_date);
    const months: string[] = [];
    const d = new Date(firstDate);
    while (d <= lastDate) {
      months.push(d.toLocaleDateString("en-US", { month: "short" }));
      d.setMonth(d.getMonth() + 1);
    }

    return { driftPath: path, driftFillPath: fillPath, emotionAnnotations: annotations, driftMonths: months.slice(0, 8) };
  }, [entries]);

  /* ── Quick save ── */
  const handleQuickSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/entries", {
        method: "POST",
        body: JSON.stringify({ content: text }),
      });
      toast({ title: "Entry saved", description: `${text.split(" ").length} words captured.` });
      setText("");
      // Refresh entries
      const data = await apiFetch("/entries?page=1&page_size=100");
      setEntries(data.entries || []);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-pen-500 animate-spin" />
        <span className="ml-3 font-mono text-xs text-pen-500">Loading your sanctuary...</span>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-12 py-8 max-w-[1400px] mx-auto">

      {/* ── GREETING HERO ── */}
      <div className="flex items-center justify-between mb-10" style={{ minHeight: 80 }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
        >
          <h1 className="font-display italic text-3xl lg:text-4xl text-pen-white leading-snug">
            {getGreeting()}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="hidden md:flex items-center gap-6"
        >
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-pen-500" style={{ animation: "session-breathe 2s ease-in-out infinite" }} />
            <span className="font-mono text-xs text-pen-400">Streak: <span className="text-pen-white">{streak} day{streak !== 1 ? "s" : ""}</span></span>
          </div>
          <span className="font-mono text-xs text-pen-400">{entries.length} entries <span className="text-pen-600">|</span> {totalWords.toLocaleString()} words</span>
          
          {/* New Start Journaling CTA for high visibility */}
          <button
            onClick={() => navigate("/journal/entries")}
            className="px-4 py-1.5 border border-pen-700 rounded-full font-mono text-[10px] text-pen-300 hover:text-pen-white hover:border-pen-500 transition-all ml-2"
          >
            Start Your Journey →
          </button>
        </motion.div>
      </div>

      {/* ── DASHBOARD GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── CARD 1: QUICK WRITE ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <PensieveCard className="p-6 h-full" tilt={false}>
            <MonoLabel className="block mb-4">TODAY'S ENTRY</MonoLabel>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => { setText(e.target.value); autoResize(); }}
                placeholder={moodPrompt}
                className="w-full min-h-[120px] max-h-[200px] bg-transparent border-none outline-none resize-none font-display text-base italic text-pen-white placeholder:text-pen-600 leading-relaxed"
              />
              {charCount > 0 && (
                <span className="absolute bottom-1 right-1 font-mono text-[9px] text-pen-600">{charCount}</span>
              )}
            </div>

            {/* Mood selector */}
            <div className="flex items-center gap-2 mt-4 mb-4">
              {moodOptions.map((m, i) => {
                const size = 20 + i * 2;
                const brightness = 15 + i * 8;
                const selected = mood === m.id;
                return (
                  <div key={m.id} className="group relative">
                    <button
                      onClick={() => setMood(selected ? null : m.id)}
                      className="rounded-full transition-all duration-200"
                      style={{
                        width: size,
                        height: size,
                        backgroundColor: `hsl(0 0% ${brightness}%)`,
                        border: selected ? "1.5px solid #aaa" : "1.5px solid transparent",
                      }}
                    />
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[8px] text-pen-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => navigate("/journal/entries")}
                className="font-mono text-[10px] text-pen-500 hover:text-pen-300 underline underline-offset-2 transition-colors"
              >
                Open full editor
              </button>
              {text.trim() && (
                <button
                  onClick={handleQuickSave}
                  disabled={saving}
                  className="font-mono text-[10px] text-pen-300 hover:text-pen-white bg-pen-800 hover:bg-pen-700 px-3 py-1 rounded transition-all"
                >
                  {saving ? "Saving..." : "Save entry"}
                </button>
              )}
            </div>
          </PensieveCard>
        </motion.div>

        {/* ── CARD 2: EMOTIONAL HEATMAP ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <PensieveCard className="p-6 h-full" tilt={false}>
            <MonoLabel className="block mb-4">WRITING DENSITY · LAST 90 DAYS</MonoLabel>

            <div className="flex flex-wrap gap-[3px]">
              {heatmapData.map((cell, i) => {
                // Determine grayscale brightness based on intensity (0.4 to 1.0)
                const baseBrightness = cell.hasEntry ? 40 + (cell.intensity * 60) : 10;
                return (
                  <div key={i} className="group relative">
                    <div
                      className="rounded-sm cursor-pointer hover:ring-1 hover:ring-pen-500 transition-all"
                      style={{
                        width: 11,
                        height: 11,
                        backgroundColor: cell.hasEntry ? `hsl(0, 0%, ${baseBrightness}%)` : "#1a1a1a",
                      }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded opacity-0 group-hover:opacity-100 pointer-events-none z-20 whitespace-nowrap transition-opacity">
                      <span className="font-mono text-[9px] text-pen-300 block">
                        {cell.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className="font-mono text-[9px] text-pen-500">
                        {cell.hasEntry ? `${cell.words} words written` : "No entry"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </PensieveCard>
        </motion.div>

        {/* ── CARD 3: WEEKLY RHYTHM ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <PensieveCard className="p-6 h-full" tilt={false}>
            <MonoLabel className="block mb-4">YOUR WRITING RHYTHM</MonoLabel>

            <div className="flex items-end gap-2 h-28">
              {weekData.map((d) => {
                const maxWords = Math.max(...weekData.map(w => w.words), 1);
                const height = (d.words / maxWords) * 100;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full flex justify-center">
                      <div
                        className="w-full max-w-[18px] rounded-t transition-all duration-200 group-hover:-translate-y-1"
                        style={{
                          height: `${Math.max(height, 3)}%`,
                          minHeight: 4,
                          backgroundColor: d.isToday ? "#888" : "#333",
                          borderTop: d.isToday ? "2px solid #aaa" : "none",
                        }}
                      />
                      {/* Tooltip */}
                      <span className="absolute -top-6 font-mono text-[8px] text-pen-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {d.words} words · {d.entryCount} entries
                      </span>
                    </div>
                    <span className="font-mono text-[8px] text-pen-600">{d.day}</span>
                  </div>
                );
              })}
            </div>

            <p className="font-mono text-[10px] text-pen-500 mt-4">Best writing day: <span className="text-pen-300">{bestDay}</span></p>
            {peakHour && <p className="font-display italic text-sm text-pen-400 mt-2">You tend to write most {peakHour}.</p>}
          </PensieveCard>
        </motion.div>

        {/* ── CARD 4: TOP THEMES ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <PensieveCard className="p-6 h-full" tilt={false}>
            <MonoLabel className="block mb-4">RECURRING THEMES</MonoLabel>

            {themes.length === 0 ? (
              <p className="font-display italic text-sm text-pen-500">Write more entries to discover patterns...</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {themes.map((t, i) => {
                  const maxCount = themes[0]?.count || 1;
                  const brightness = 40 + (t.count / maxCount) * 40;
                  return (
                    <motion.div
                      key={t.label}
                      whileHover={{ scale: 1.08 }}
                      className="group relative px-3 py-1.5 border rounded-full font-ui text-xs transition-colors cursor-default"
                      style={{
                        backgroundColor: "#1a1a1a",
                        borderColor: "#333",
                        color: `hsl(0 0% ${brightness}%)`,
                        fontSize: `${11 + (t.count > 10 ? 1 : 0)}px`,
                        transform: `translateY(${i % 2 === 0 ? 0 : 4}px)`,
                      }}
                    >
                      {t.label}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-[#1a1a1a] border border-[#333] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                        <span className="block font-mono text-[9px] text-pen-400 mb-1">Appeared in {t.count} entries</span>
                        <span className="block font-ui text-xs text-pen-200 leading-snug">{t.desc}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </PensieveCard>
        </motion.div>

        {/* ── CARD 5: STATS SUMMARY ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <PensieveCard className="p-6 h-full" tilt={false}>
            <MonoLabel className="block mb-4">YOUR NUMBERS</MonoLabel>

            <div className="space-y-4">
              <div>
                <span className="font-display italic text-3xl text-pen-white">{entries.length}</span>
                <span className="font-mono text-[10px] text-pen-500 ml-2">total entries</span>
              </div>
              <div>
                <span className="font-display italic text-3xl text-pen-white">{totalWords.toLocaleString()}</span>
                <span className="font-mono text-[10px] text-pen-500 ml-2">words written</span>
              </div>
              <div>
                <span className="font-display italic text-3xl text-pen-white">{entries.length > 0 ? Math.round(totalWords / entries.length) : 0}</span>
                <span className="font-mono text-[10px] text-pen-500 ml-2">avg words/entry</span>
              </div>
              {entries.length > 0 && (
                <div className="pt-2 border-t border-pen-800">
                  <span className="font-mono text-[9px] text-pen-600">
                    First entry: {new Date(entries[entries.length - 1]?.entry_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          </PensieveCard>
        </motion.div>

        {/* ── CARD 6: EMOTIONAL DRIFT (full width) ── */}
        {entries.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-3">
            <PensieveCard className="p-6" tilt={false}>
              <MonoLabel className="block mb-4">EMOTIONAL DRIFT · {entries.length} ENTRIES</MonoLabel>

              <div className="relative w-full h-40 overflow-hidden">
                <svg viewBox="0 0 800 160" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="drift-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#888" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#888" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  {driftFillPath && (
                    <motion.path
                      d={driftFillPath}
                      fill="url(#drift-fill)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 1 }}
                    />
                  )}
                  {driftPath && (
                    <motion.path
                      d={driftPath}
                      fill="none"
                      stroke="#666"
                      strokeWidth="1.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.5, duration: 2, ease: "easeOut" }}
                    />
                  )}
                  {emotionAnnotations.map((ann, i) => (
                    <circle key={i} cx={ann.x} cy={ann.y} r="3" fill="#888" />
                  ))}
                </svg>

                {/* Annotations */}
                {emotionAnnotations.map((ann, i) => (
                  <span
                    key={i}
                    className="absolute font-display italic text-[11px] text-pen-500"
                    style={{
                      top: `${(ann.y / 160) * 100 - 10}%`,
                      left: `${(ann.x / 800) * 100}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {ann.label}
                  </span>
                ))}

                {/* Y-axis emotion labels */}
                <span className="absolute font-mono text-[8px] text-pen-600" style={{ top: "10%", right: 4 }}>joy</span>
                <span className="absolute font-mono text-[8px] text-pen-600" style={{ top: "45%", right: 4 }}>neutral</span>
                <span className="absolute font-mono text-[8px] text-pen-600" style={{ top: "75%", right: 4 }}>heavy</span>
              </div>

              {/* X-axis months */}
              <div className="flex justify-between mt-2">
                {driftMonths.map((m, i) => (
                  <span key={i} className="font-mono text-[9px] text-pen-600">{m}</span>
                ))}
              </div>
            </PensieveCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
