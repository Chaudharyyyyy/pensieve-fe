import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MonoLabel } from "@/components/pensieve/MonoLabel";
import { StatusDot } from "@/components/pensieve/StatusDot";
import { EncryptionBadge } from "@/components/pensieve/EncryptionBadge";
import { GlyphButton } from "@/components/pensieve/GlyphButton";
import { DisplayHeading } from "@/components/pensieve/DisplayHeading";
import { ThemeChip } from "@/components/pensieve/ThemeChip";
import { PensieveCard } from "@/components/pensieve/PensieveCard";

/* ── TODAY VIEW ── */
const TodayView = () => {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
  }, []);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/entries", { method: "POST", body: JSON.stringify({ content: text.trim() }) });
      setText("");
      toast({ title: "Archived", description: "Your reflection has been safely stored." });
    } catch (e: any) {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-12 py-8">
      <DisplayHeading className="text-5xl text-pen-white mb-3">What's on your mind?</DisplayHeading>
      <MonoLabel className="block mb-10">Your entry is encrypted before it leaves this screen</MonoLabel>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); autoResize(); }}
          placeholder="Begin writing..."
          className="w-full min-h-[300px] bg-pen-900/50 border border-pen-800 p-6 font-display text-lg italic text-pen-white placeholder:text-pen-600 outline-none resize-none focus:border-pen-700 transition-colors"
        />
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {saving && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <StatusDot />
              <MonoLabel className="text-[9px]">Saving...</MonoLabel>
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-6">
          <MonoLabel>{wordCount} words</MonoLabel>
          <MonoLabel>{text.length} characters</MonoLabel>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <GlyphButton variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Entry"}
        </GlyphButton>
        <GlyphButton variant="ghost" disabled>Request Reflection</GlyphButton>
      </div>
    </div>
  );
};

/* ── PATTERNS VIEW ── */
const PatternsView = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/entries?page=1&page_size=100");
        if (res && res.entries) setEntries(res.entries);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const heatmapData = Array.from({ length: 90 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (89 - i));
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    const dateStr = d.toISOString().split("T")[0];
    const match = entries.find((e: any) => e.entry_date === dateStr);
    return {
      date: d,
      hasEntry: !!match,
      words: match?.word_count || 0,
      intensity: match ? Math.min((match.word_count || 0) / 300, 1) : 0,
    };
  });

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-6 h-6 border-2 border-pen-500 border-t-transparent rounded-full" /></div>;

  // Linguistic pattern extractor
  const analyzeLinguisticPatterns = () => {
    if (!entries.length) return { topWords: [], styleTraits: [] };

    const stopWords = new Set([
      "the", "and", "a", "to", "of", "in", "i", "is", "that", "it", "on", "you", "this", "for", "but", "with",
      "are", "have", "be", "at", "or", "as", "was", "so", "if", "out", "not", "my", "me", "about", "like",
      "just", "what", "when", "how", "up", "can", "they", "we", "know", "get", "do", "all", "think", "really",
      "from", "because", "some", "time", "would", "which", "there", "their", "an", "your", "by", "she", "he",
      "them", "were", "been", "could", "who", "has", "will", "more", "then", "into", "us", "no", "one", "very",
      "even", "much", "than", "make", "over", "also", "only", "our", "these", "those", "ve", "m", "re", "ll",
      "don", "didn", "doesn", "won", "can", "cant", "cannot", "it's", "i'm", "i've", "you're", "don't", "didn't",
      "too", "had", "did", "am", "any", "got", "going", "things", "thing", "way", "see", "say", "said", "now"
    ]);

    const wordCounts: Record<string, number> = {};
    let totalSentences = 0;
    let questionsAsked = 0;
    let longWords = 0;
    let totalWordsClean = 0;

    entries.forEach((e: any) => {
      const text = e.content || "";
      // Style metrics
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      totalSentences += sentences.length;
      questionsAsked += (text.match(/\?/g) || []).length;

      const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
      words.forEach((w: string) => {
        if (!w) return;
        totalWordsClean++;
        if (w.length > 6) longWords++;
        if (w.length > 3 && !stopWords.has(w)) {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      });
    });

    const topWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Derive Behavioral/Style traits based on metrics
    const styleTraits = [];
    const avgWordsPerSentence = totalSentences ? totalWordsClean / totalSentences : 0;
    const vocabComplexity = totalWordsClean ? longWords / totalWordsClean : 0;

    if (questionsAsked > entries.length * 0.5) {
      styleTraits.push({ label: "Inquisitive Framing", desc: "You frequently ask yourself questions, indicating active self-interrogation." });
    } else {
      styleTraits.push({ label: "Declarative Processing", desc: "You tend to make definitive statements rather than asking open questions, processing through assertion." });
    }

    if (avgWordsPerSentence > 18) {
      styleTraits.push({ label: "Complex Syntax", desc: "Your sentences run long, suggesting deeply intertwined trains of thought." });
    } else {
      styleTraits.push({ label: "Concise Phrasing", desc: "You write in short, punctuation-heavy bursts, delivering quick observations." });
    }

    if (vocabComplexity > 0.2) {
       styleTraits.push({ label: "Elevated Vernacular", desc: "You rely on complex terminology to capture specific nuances in your reflections." });
    }

    return { topWords, styleTraits };
  };

  const { topWords, styleTraits } = analyzeLinguisticPatterns();

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-12 py-8">
      <DisplayHeading className="text-4xl text-pen-white mb-8">Patterns</DisplayHeading>

      <MonoLabel className="block mb-4">Activity Heatmap</MonoLabel>
      <PensieveCard className="p-6 mb-12" tilt={false}>
        <div className="flex flex-wrap gap-[3px]">
          {heatmapData.map((cell, i) => {
            const baseBrightness = cell.hasEntry ? 40 + (cell.intensity * 60) : 10;
            return (
              <div key={i} className="group relative">
                <div
                  className="rounded-sm cursor-pointer hover:ring-1 hover:ring-pen-500 transition-all"
                  style={{ width: 14, height: 14, backgroundColor: cell.hasEntry ? `hsl(0, 0%, ${baseBrightness}%)` : "#1a1a1a" }}
                />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
           <DisplayHeading className="text-2xl text-pen-white mb-6">Linguistic Cues</DisplayHeading>
           <PensieveCard className="p-6" tilt={false}>
             <p className="font-mono text-[10px] text-pen-400 mb-6 uppercase tracking-wider">Top recurring concepts</p>
             <div className="space-y-4">
               {topWords.map(([word, count]) => (
                 <div key={word} className="flex items-center justify-between">
                   <span className="font-display italic text-pen-300 capitalize text-lg">{word}</span>
                   <span className="font-mono text-[10px] text-pen-500">{count} occurrences</span>
                 </div>
               ))}
             </div>
             <p className="font-mono text-[10px] text-pen-500 mt-6 pt-4 border-t border-pen-800 leading-relaxed">
               You have a tendency to anchor your reflections around these terms. Notice how frequently they appear in your recent entries.
             </p>
           </PensieveCard>
        </div>

        <div>
           <DisplayHeading className="text-2xl text-pen-white mb-6">Writing Style</DisplayHeading>
           <PensieveCard className="p-6 h-full" tilt={false}>
             <div className="space-y-6">
                {styleTraits.map((trait, idx) => (
                  <div key={idx}>
                    <MonoLabel className="text-pen-400 mb-2">{trait.label}</MonoLabel>
                    <p className="font-display italic text-pen-300 text-sm">{trait.desc}</p>
                  </div>
                ))}
                {styleTraits.length === 0 && (
                  <p className="font-display italic text-pen-500 text-sm">Write a few more entries to reveal your stylistic patterns.</p>
                )}
             </div>
           </PensieveCard>
        </div>
      </div>
    </div>
  );
};

/* ── INSIGHTS VIEW ── */
const InsightsView = () => {
  const [reflections, setReflections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Helper flag to prevent double-generation loops on mount
  const [hasAttemptedGen, setHasAttemptedGen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/reflections");
        if (res && res.reflections && res.reflections.length > 0) {
          setReflections(res.reflections);
        } else if (!hasAttemptedGen) {
          // If none exist, try to generate exactly once automatically
          setHasAttemptedGen(true);
          try {
             // Let the backend decide if we have enough entries
             const genRes = await apiFetch("/reflections/suggest");
             if (genRes && genRes.reflections && genRes.reflections.length > 0) {
               setReflections(genRes.reflections);
             }
          } catch(e) {
             console.log("Auto-gen skipped or failed", e);
          }
        }
      } catch (err) {
        console.error("Failed to load reflections", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [hasAttemptedGen]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await apiFetch("/reflections/suggest");
      if (res && res.reflections && res.reflections.length > 0) {
        setReflections((prev) => {
          // ensure we don't accidentally duplicate
          const newRefs = res.reflections.filter((newRef: any) => !prev.find((old: any) => old.id === newRef.id));
          return [...newRefs, ...prev];
        });
      } else {
        alert("Not enough new entries to generate a meaningful insight, or you hit the weekly generation limit. Keep journaling!");
      }
    } catch (err) {
      console.error("Failed to generate reflection", err);
      alert("Error generating insight.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-6 h-6 border-2 border-pen-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-[680px] mx-auto px-6 lg:px-12 py-8">
      <div className="flex items-center justify-between mb-8">
        <DisplayHeading className="text-4xl text-pen-white">Insights</DisplayHeading>
        <GlyphButton variant="ghost" onClick={handleGenerate} disabled={generating}>
          {generating ? "Synthesizing..." : "Generate New Insight"}
        </GlyphButton>
      </div>

      {reflections.length === 0 ? (
        <div className="text-center py-20 px-6 border border-pen-800 rounded mt-8">
          <p className="font-display italic text-lg text-pen-500 mb-4">You haven't generated any insights yet.</p>
          <GlyphButton onClick={handleGenerate} disabled={generating}>
            {generating ? "Analyzing your entries..." : "Analyze Recent Journal"}
          </GlyphButton>
        </div>
      ) : (
        <div className="space-y-8">
          {reflections.map((ref) => (
            <PensieveCard key={ref.id} className="p-8" tilt={false}>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-[10px] text-pen-500">
                  {new Date(ref.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
                <span className="font-mono text-[9px] px-2 py-1 bg-pen-900 text-pen-400 rounded">
                  {ref.metadata?.confidence} confidence
                </span>
              </div>
              <span className="font-display text-7xl text-pen-800 leading-none select-none block -mb-6">"</span>
              <p className="font-display italic text-lg text-pen-300 leading-[1.9] mb-6">
                {ref.content}
              </p>

              {ref.metadata?.concepts && ref.metadata.concepts.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {ref.metadata.concepts.map((c: any) => (
                    <div key={c.id || c.name} className="group relative">
                      <ThemeChip label={c.name} description={c.description || "Related concept"} />
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-pen-800 pt-4">
                <MonoLabel className="text-[9px] leading-relaxed block text-pen-500">
                  This reflection is observational, not clinical. Pensieve does not diagnose.
                </MonoLabel>
              </div>
            </PensieveCard>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── CONCEPTS VIEW ── */
const ConceptsView = () => {
  const [concepts, setConcepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/concepts?page=1&page_size=50");
        if (res && res.concepts) setConcepts(res.concepts);
      } catch (err) {
        console.error("Failed to load concepts", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-6 h-6 border-2 border-pen-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-12 py-8">
      <DisplayHeading className="text-4xl text-pen-white mb-8">Concepts</DisplayHeading>
      
      {concepts.length === 0 ? (
        <div className="text-center py-20 px-6 border border-pen-800 rounded mt-8">
          <p className="font-display italic text-lg text-pen-500">No concepts discovered yet.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {concepts.map((c) => (
            <div key={c.id || c.name} className="group relative">
              <ThemeChip label={c.name} description={c.description} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── JOURNAL ROUTER (no sidebar) ── */
const Journal = () => {
  const location = useLocation();

  const renderView = () => {
    switch (location.pathname) {
      case "/journal/patterns": return <PatternsView />;
      case "/journal/insights": return <InsightsView />;
      case "/journal/concepts": return <ConceptsView />;
      default: return <TodayView />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {renderView()}
      </motion.div>
    </AnimatePresence>
  );
};

export default Journal;
