import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MonoLabel } from "@/components/pensieve/MonoLabel";
import { StatusDot } from "@/components/pensieve/StatusDot";
import { GlyphButton } from "@/components/pensieve/GlyphButton";
import { Trash2, MapPin, Lightbulb, Tag, Loader2, Search } from "lucide-react";

/* ── Types ── */
interface EntryData {
  id: string;
  user_id: string;
  content: string;
  entry_date: string;
  word_count?: number;
  created_at: string;
}

const FILTERS = ["All", "This week", "This month", "By theme"];

/* ── Journal Page ── */
const JournalEntries = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Load actual entries from API
  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch("/entries?page=1&page_size=100");
        const loadedEntries = data.entries || [];
        setEntries(loadedEntries);
        
        // Smart Default: If the first entry is from Today, select it.
        // Otherwise, start fresh for Today.
        const todayStr = new Date().toISOString().split("T")[0];
        if (loadedEntries.length > 0 && loadedEntries[0].entry_date === todayStr) {
          setSelectedId(loadedEntries[0].id);
        } else {
          setSelectedId(null);
          setText("");
        }
      } catch (err: any) {
        toast({ title: "Failed to load entries", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  const selected = entries.find(e => e.id === selectedId);

  // Pre-fill editor when entry is selected
  useEffect(() => {
    if (selected) setText(selected.content);
  }, [selectedId, selected]);

  // Autosave Logic
  useEffect(() => {
    if (!text || (selected && selected.content === text)) return;
    
    setSaving(true);
    clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch("/entries/autosave", {
          method: "POST",
          body: JSON.stringify({
            entry_id: selectedId,
            content: text.trim()
          })
        });
        
        if (res && res.entry_id) {
          setLastSaved(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
          
          // If this was a new entry, upgrade it to an existing one
          if (!selectedId) {
            setSelectedId(res.entry_id);
            // Re-fetch list to show the new entry in sidebar
            const data = await apiFetch("/entries?page=1&page_size=100");
            setEntries(data.entries || []);
          } else {
            // Update local entries list word count/preview without full fetch
            setEntries(prev => prev.map(e => e.id === res.entry_id ? { ...e, content: text, word_count: res.word_count } : e));
          }
        }
      } catch (e) {
        console.error("Autosave failed", e);
      } finally {
        setSaving(false);
      }
    }, 1500);
    
    return () => clearTimeout(timerRef.current);
  }, [text, selectedId]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
  }, []);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/entries", { method: "POST", body: JSON.stringify({ content: text.trim() }) });
      toast({ title: "Archived", description: "Your reflection has been safely stored." });
      // Reload on save
      const data = await apiFetch("/entries?page=1&page_size=100");
      setEntries(data.entries || []);
    } catch (e: any) {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filteredEntries = entries.filter(e =>
    !searchQuery || e.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)] bg-pen-black">
        <Loader2 className="w-6 h-6 text-pen-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)]">

      {/* ── LEFT PANEL: ENTRY LIST ── */}
      <aside className="w-full lg:w-[380px] border-r border-pen-800 flex flex-col bg-pen-950 shrink-0">
        {/* Header with New Entry */}
        <div className="p-6 border-b border-pen-800 flex items-center justify-between">
          <MonoLabel className="text-pen-400">History</MonoLabel>
          <GlyphButton 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2"
            onClick={() => {
              setSelectedId(null);
              setText("");
              setLastSaved(null);
            }}
          >
            + New
          </GlyphButton>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-pen-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-pen-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your memories..."
              className="w-full bg-pen-900 border border-pen-800 rounded pl-9 pr-3 py-2 font-mono text-xs text-pen-white placeholder:text-pen-600 outline-none focus:border-pen-700 transition-colors"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-3 py-1 font-mono text-[10px] rounded-full border whitespace-nowrap transition-colors",
                activeFilter === f
                  ? "border-pen-500 text-pen-white bg-pen-800"
                  : "border-pen-800 text-pen-500 hover:text-pen-300 hover:border-pen-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Entry list */}
        <div className="flex-1 overflow-y-auto">
          {filteredEntries.map(entry => {
            const d = new Date(entry.entry_date);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // Fix timezone mismatch
            return (
              <button
                key={entry.id}
                onClick={() => setSelectedId(entry.id)}
                className={cn(
                  "w-full text-left px-4 py-4 border-b border-pen-900 transition-all group",
                  selectedId === entry.id ? "bg-pen-900" : "hover:bg-pen-900/50"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] text-pen-500">
                    {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span className="font-mono text-[9px] text-pen-600">{entry.word_count || 0}w</span>
                </div>
                <p className="font-display italic text-sm text-pen-300 line-clamp-2 leading-relaxed">
                  {entry.content}
                </p>
                {/* hover arrow */}
                <span className="font-mono text-[10px] text-pen-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-block">→</span>
              </button>
            );
          })}
          {filteredEntries.length === 0 && (
            <div className="p-8 text-center text-pen-500 font-display italic">No entries found.</div>
          )}
        </div>
      </aside>

      {/* ── RIGHT PANEL: EDITOR ── */}
      <div className="hidden lg:flex flex-1 flex-col">
        {selected ? (() => {
          const sd = new Date(selected.entry_date);
          sd.setMinutes(sd.getMinutes() - sd.getTimezoneOffset());
          return (
            <>
              {/* Editor header */}
              <div className="flex items-center justify-between px-8 py-4 border-b border-pen-800">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-pen-500">
                    {sd.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  <span className="font-mono text-[10px] text-pen-600">{selected.word_count} words</span>
                </div>
                <div className="flex items-center gap-2">
                  {lastSaved && (
                    <span className="font-mono text-[9px] text-pen-600 flex items-center gap-1.5">
                      <StatusDot /> Saved {lastSaved}
                    </span>
                  )}
                </div>
              </div>

              {/* Editor body */}
              <div className="flex-1 overflow-y-auto px-8 py-6 relative">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => { setText(e.target.value); autoResize(); }}
                  placeholder="Begin writing..."
                  className="w-full min-h-[400px] bg-transparent outline-none resize-none font-display text-xl italic text-pen-white placeholder:text-pen-600 leading-[1.9]"
                />

                {/* Floating toolbar */}
                <div className="absolute top-6 right-0 flex flex-col gap-2 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  {[
                    { icon: Lightbulb, tip: "Link to insight" },
                    { icon: MapPin, tip: "Mind map (disabled)" },
                    { icon: Tag, tip: "Add tag" },
                    { icon: Trash2, tip: "Delete" },
                  ].map(({ icon: Icon, tip }) => (
                    <div key={tip} className="group relative">
                      <button className="w-8 h-8 rounded bg-pen-900 border border-pen-800 flex items-center justify-center text-pen-500 hover:text-pen-300 hover:border-pen-700 transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 font-mono text-[9px] text-pen-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {tip}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editor footer */}
              <div className="flex items-center gap-4 px-8 py-4 border-t border-pen-800">
                <GlyphButton variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Entry"}
                </GlyphButton>
                <GlyphButton variant="ghost" disabled>
                  Request Reflection
                </GlyphButton>
              </div>
            </>
          );
        })() : (
          <div className="flex-1 flex flex-col">
            {/* New Entry Header */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-pen-800">
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-pen-white">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </span>
                <MonoLabel className="text-pen-500 uppercase tracking-widest text-[9px]">New Reflection</MonoLabel>
              </div>
              <div className="flex items-center gap-2">
                {saving && <StatusDot className="animate-pulse" />}
                {lastSaved && (
                  <span className="font-mono text-[9px] text-pen-600">Saved {lastSaved}</span>
                )}
              </div>
            </div>

            {/* Editor body */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => { setText(e.target.value); autoResize(); }}
                placeholder="Today's reflection begins here..."
                className="w-full min-h-[400px] bg-transparent outline-none resize-none font-display text-xl italic text-pen-white placeholder:text-pen-800 leading-[1.9]"
                autoFocus
              />
            </div>

            {/* Editor footer */}
            <div className="flex items-center gap-4 px-8 py-4 border-t border-pen-800">
              <GlyphButton variant="primary" onClick={handleSave} disabled={saving}>
                Archive Now
              </GlyphButton>
              <MonoLabel className="text-pen-600 text-[9px]">Your entry is being secured in real-time</MonoLabel>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalEntries;
