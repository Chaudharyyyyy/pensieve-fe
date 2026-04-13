import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Lock, LogOut, User, ChevronDown, Menu, X, Edit3 } from "lucide-react";

const navTabs = [
  { label: "Dashboard", path: "/journal/dashboard" },
  { label: "Journal", path: "/journal/entries" },
  { label: "Penn", path: "/journal/penn" },
  { label: "Patterns", path: "/journal/patterns" },
  { label: "Insights", path: "/journal/insights" },
  { label: "Concepts", path: "/journal/concepts" },
  { label: "Settings", path: "/settings" },
];

export const TopNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.email?.slice(0, 2).toUpperCase() || "AN";

  const isActive = (path: string) => {
    if (path === "/journal/dashboard") return location.pathname === "/journal/dashboard" || location.pathname === "/journal";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 lg:px-10"
        style={{
          backgroundColor: "#111111",
          borderBottom: "1px solid #252525",
        }}
      >
        {/* Left — Wordmark + breathing dot */}
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="font-display italic text-xl tracking-wider cursor-pointer"
            style={{ color: "#f5f5f0" }}
            onClick={() => navigate("/journal/dashboard")}
          >
            Pensieve
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full bg-pen-400"
            style={{ animation: "session-breathe 3s ease-in-out infinite" }}
          />
        </div>

        {/* Center — Nav tabs (desktop) */}
        <nav className="hidden lg:flex items-center justify-center flex-1 gap-1">
          {navTabs.map((tab) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "relative px-3 py-1.5 font-ui text-xs uppercase tracking-[0.15em] transition-colors duration-200",
                  active
                    ? "text-[#f5f5f0]"
                    : "text-[#555555] hover:text-[#cccccc]"
                )}
                style={active ? { background: "rgba(200,200,190,0.04)", borderRadius: "4px" } : {}}
              >
                {tab.label}
                {active && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ backgroundColor: "#aaaaaa" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {!active && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-[#cccccc] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 hover:scale-x-100" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right — Write + Lock + Avatar */}
        <div className="flex items-center gap-4 ml-auto shrink-0" ref={profileRef}>
          {/* Prominent Write Button */}
          <button
            onClick={() => navigate("/journal/entries")}
            className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-pen-white text-pen-black rounded-full font-ui text-[10px] uppercase tracking-widest hover:bg-pen-500 transition-all group"
          >
            <Edit3 className="w-3 h-3 group-hover:scale-110 transition-transform" />
            Write
          </button>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-pen-400 hover:text-pen-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {/* Removed Lock Icon as per user requested */}

          {/* Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-8 h-8 rounded-full bg-pen-800 border border-pen-700 flex items-center justify-center text-pen-300 font-mono text-xs hover:border-pen-500 transition-colors"
            >
              {initials}
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-[#1a1a1a] border border-[#333] rounded-md py-3 px-4 z-50 shadow-xl"
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-pen-800 mb-2">
                    <div className="w-9 h-9 rounded-full bg-pen-800 flex items-center justify-center text-pen-300 font-mono text-sm">
                      {initials}
                    </div>
                    <div>
                      <p className="font-ui text-xs text-pen-white">{user?.email || "Guest"}</p>
                      <p className="font-mono text-[9px] text-pen-500">Active session</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { navigate("/settings"); setShowProfile(false); }}
                    className="w-full text-left font-mono text-xs text-pen-400 hover:text-pen-white py-1.5 transition-colors"
                  >
                    <User className="w-3 h-3 inline mr-2" />My Profile
                  </button>
                  <button
                    onClick={async () => {
                      await signOut();
                      navigate("/");
                      setShowProfile(false);
                    }}
                    className="w-full text-left font-mono text-xs text-pen-400 hover:text-pen-white py-1.5 transition-colors"
                  >
                    <LogOut className="w-3 h-3 inline mr-2" />Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-pen-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] border-t border-[#252525] rounded-t-2xl px-6 py-6 lg:hidden"
            >
              <div className="w-10 h-1 bg-pen-700 rounded-full mx-auto mb-6" />
              {navTabs.map((tab) => (
                <button
                  key={tab.path}
                  onClick={() => {navigate(tab.path); setMobileOpen(false);}}
                  className={cn(
                    "block w-full text-left font-ui text-sm uppercase tracking-[0.1em] py-3 transition-colors",
                    isActive(tab.path) ? "text-pen-white" : "text-pen-500 hover:text-pen-300"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
