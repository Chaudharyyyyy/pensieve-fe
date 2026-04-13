import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Sparkles, 
  History, 
  Hash, 
  Lightbulb,
  CornerDownRight,
  Loader2,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

const modes = {
  mirror: { label: "Mirror", color: "#f5f5f0" },
  philosopher: { label: "Philosopher", color: "#a8c0ff" },
  therapist: { label: "Therapist", color: "#ffb0b0" }
};

export default function Penn() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [mode, setMode] = useState<keyof typeof modes>("mirror");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState<string[]>([
    "What patterns do you notice in me?",
    "Why do I keep feeling stuck?",
    "Tell me something I'm avoiding."
  ]);
  const [activeConcepts, setActiveConcepts] = useState<string[]>([]);
  const [referencedEntries, setReferencedEntries] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize conversation on mount
  useEffect(() => {
    const initPenn = async () => {
      try {
        console.log("Initializing Penn session...");
        setIsInitializing(true);
        const data = await apiFetch("/penn/init");
        console.log("Penn init data received:", data);
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
        }
        if (data.messages && data.messages.length > 0) {
          console.log(`Restoring ${data.messages.length} messages.`);
          setMessages(data.messages);
          
          // Find the last message that actually has concepts or entries to populate the sidebar
          const lastWithContext = [...data.messages].reverse().find(m => 
            (m.active_concepts && m.active_concepts.length > 0) || 
            (m.referenced_entries && m.referenced_entries.length > 0)
          );
          
          if (lastWithContext) {
            if (lastWithContext.active_concepts) setActiveConcepts(lastWithContext.active_concepts);
            if (lastWithContext.referenced_entries) setReferencedEntries(lastWithContext.referenced_entries);
          }
          
          const lastMsg = data.messages[data.messages.length - 1];
          setMode(lastMsg.mode as any || "mirror");
        }
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      } catch (err) {
        console.error("Failed to initialize Penn:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    initPenn();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || loading) return;
    
    const userMsg = { sender: "user", content: textToSend, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await apiFetch("/penn/chat", {
        method: "POST",
        body: JSON.stringify({ content: textToSend, conversation_id: conversationId })
      });
      setMessages(prev => [...prev, data]);
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }
      setMode(data.mode as any);
      if (data.active_concepts) setActiveConcepts(data.active_concepts);
      if (data.referenced_entries) setReferencedEntries(data.referenced_entries);
      if (data.suggestions && data.suggestions.length > 0) setSuggestions(data.suggestions);
    } catch (err) {
      console.error("Penn is quiet:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0a0a0a]">
      {/* 65% Main Conversation Panel */}
      <div className="w-[65%] flex flex-col relative border-r border-[#1a1a1a]">
        
        {/* Header Indicator */}
        <div className="absolute top-6 left-10 z-10 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full transition-colors duration-1000" style={{ backgroundColor: modes[mode].color, boxShadow: `0 0 10px ${modes[mode].color}` }} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#555]">
              System: <span className="text-[#f5f5f0]">{modes[mode].label}</span>
            </span>
          </div>
        </div>

        {/* Scrollable Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto pt-24 pb-32 px-10 scroll-smooth"
        >
          <div className="max-w-2xl mx-auto space-y-12">
            {isInitializing ? (
              <div className="flex flex-col items-center justify-center h-full pt-20 gap-4">
                <Loader2 className="w-8 h-8 text-[#f5f5f0] animate-spin opacity-20" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#444]">Recalling Memory...</span>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pt-10"
                >
                  <h1 className="font-display italic text-4xl text-[#f5f5f0] opacity-80 leading-relaxed">
                    "I have read everything you ever wrote in the dark.<br/>What are we looking at today?"
                  </h1>
                  <div className="flex flex-wrap gap-3">
                    {suggestions.map(chip => (
                      <button 
                        key={chip}
                        onClick={() => handleSend(chip)}
                        className="px-4 py-2 bg-[#151515] border border-[#222] rounded-full font-ui text-[11px] uppercase tracking-widest text-[#777] hover:text-[#f5f5f0] hover:border-[#444] transition-all"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className={cn(
                    "flex flex-col gap-2",
                    msg.sender === "user" ? "items-end" : "items-start"
                  )}
                >
                  {msg.sender === "penn" && (
                    <div className="font-mono text-[9px] uppercase tracking-widest text-[#444] mb-2 flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#444] rounded-full" />
                      PENN / {msg.mode}
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[85%] text-lg leading-relaxed",
                    msg.sender === "user" 
                      ? "font-ui text-[#888] text-right italic" 
                      : "font-display text-[#f5f5f0] font-light"
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4 items-center pl-2"
                >
                   <div className="flex gap-1.5 h-6 items-center">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          height: [6, 12, 6],
                          opacity: [0.2, 0.5, 0.2]
                        }}
                        transition={{ 
                          duration: 1.2, 
                          repeat: Infinity, 
                          delay: i * 0.2 
                        }}
                        className="w-[2px] bg-[#f5f5f0]"
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#444]">Analyzing Mirror ...</span>
                </motion.div>
              )}
            </AnimatePresence>
            )}
          </div>
        </div>

        {/* Input Dock */}
        <div className="absolute bottom-10 left-0 right-0 px-10">
          <div className="max-w-2xl mx-auto relative group">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Speak to yourself..."
              className="w-full bg-[#111] border border-[#222] py-4 px-6 pr-14 text-[#f5f5f0] font-ui transition-all focus:outline-none focus:border-[#444] focus:ring-1 focus:ring-[#333] placeholder:text-[#333]"
            />
            <button 
              onClick={handleSend}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#444] group-focus-within:text-[#f5f5f0] transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 35% Context Sidebar */}
      <div className="w-[35%] bg-[#080808] p-10 flex flex-col gap-12 overflow-y-auto">
        
        {/* Referenced Entries */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-[#444]">
            <History className="w-4 h-4" />
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em]">Referenced Entries</h3>
          </div>
          <div className="space-y-4">
            {referencedEntries.length === 0 && (
               <div className="text-[#555] font-ui text-xs italic">No specific entries highlighted yet.</div>
            )}
            {referencedEntries.map((entry, i) => (
              <div key={i} className="group p-4 border border-[#1a1a1a] hover:border-[#333] transition-colors cursor-pointer bg-[#0c0c0c]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[9px] text-[#444]">{entry.date}</span>
                  <ArrowUpRight className="w-3 h-3 text-[#333] group-hover:text-[#666]" />
                </div>
                <p className="font-display italic text-[#777] text-sm line-clamp-2">
                  "{entry.snippet}"
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Active Concepts */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-[#444]">
            <Hash className="w-4 h-4" />
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em]">Active Concepts</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeConcepts.length === 0 && (
               <div className="text-[#555] font-ui text-xs italic">Analyzing semantic space...</div>
            )}
            {activeConcepts.map(tag => (
              <div key={tag} className="px-3 py-1.5 border border-[#1a1a1a] bg-[#0c0c0c] text-[#666] font-ui text-[10px] uppercase tracking-widest flex items-center gap-2 hover:border-[#444] transition-colors cursor-help">
                <span className="w-1 h-1 bg-pen-400 rounded-full" />
                {tag}
              </div>
            ))}
          </div>
        </section>

        {/* Live Insights */}
        <section className="mt-auto p-6 border border-[#1a1a1a] bg-[#0c0c0c] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
            <Lightbulb className="w-12 h-12 text-[#f5f5f0]" />
          </div>
          <h4 className="font-mono text-[9px] uppercase tracking-widest text-[#444] mb-3">Penn's Insight</h4>
          <p className="font-ui text-xs text-[#888] leading-relaxed italic">
            "You mention 'guilt' only when you write about your sister. There is an anchor there we haven't pulled up yet."
          </p>
        </section>

      </div>
    </div>
  );
}
