import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { AppShell } from "@/components/pensieve/AppShell";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import JournalEntries from "./pages/JournalEntries";
import Penn from "./pages/Penn";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

// Keep the old Journal for Patterns + Insights + Concepts views
import Journal from "./pages/Journal";

const queryClient = new QueryClient();

/* Wrapper that uses AppShell for post-login pages */
const PostLoginPage = ({ children }: { children: React.ReactNode }) => (
  <AppShell>{children}</AppShell>
);

/* Animated page wrapper */
const AnimatedPage = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public pages — no AppShell */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Post-login pages — wrapped in AppShell */}
        <Route path="/journal/dashboard" element={<PostLoginPage><Dashboard /></PostLoginPage>} />
        <Route path="/journal/entries" element={<PostLoginPage><JournalEntries /></PostLoginPage>} />
        <Route path="/journal/penn" element={<PostLoginPage><Penn /></PostLoginPage>} />
        <Route path="/journal/timeline" element={<PostLoginPage><Journal /></PostLoginPage>} />
        <Route path="/journal/patterns" element={<PostLoginPage><Journal /></PostLoginPage>} />
        <Route path="/journal/insights" element={<PostLoginPage><Journal /></PostLoginPage>} />
        <Route path="/journal/concepts" element={<PostLoginPage><Journal /></PostLoginPage>} />
        <Route path="/settings" element={<PostLoginPage><SettingsPage /></PostLoginPage>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const { initialize: initializeAuth, initialized } = useAuth();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Check for critical configuration
  const isConfigured = 
    Boolean(import.meta.env.VITE_SUPABASE_URL) && 
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-pen-black flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-pen-100 font-display text-2xl tracking-tighter uppercase italic">
              Missing Neural Configuration
            </h1>
            <p className="text-pen-500 font-mono text-[11px] leading-relaxed uppercase tracking-widest">
              Neural state sync failed because the secure configuration is incomplete.
            </p>
          </div>
          
          <div className="bg-pen-900/30 border border-pen-800/50 p-6 rounded-sm text-left font-mono text-[10px] space-y-4">
            <p className="text-pen-400 leading-normal">
              For local development, ensure your <code className="text-pen-200">.env</code> file contains:
            </p>
            <pre className="text-pen-300 opacity-80 overflow-x-auto">
              VITE_SUPABASE_URL=...{"\n"}
              VITE_SUPABASE_ANON_KEY=...
            </pre>
            <p className="text-pen-400 leading-normal border-t border-pen-800/30 pt-4">
              For hosted environments (GitHub Pages), add these as <span className="text-pen-200">GitHub Secrets</span> in your repository settings under <span className="text-pen-100">Settings &gt; Secrets and variables &gt; Actions</span>.
            </p>
          </div>

          <div className="text-pen-600 font-mono text-[9px] uppercase tracking-widest animate-pulse">
            Waiting for secure handshake...
          </div>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="min-h-screen bg-pen-black flex items-center justify-center font-mono text-[10px] text-pen-500 uppercase tracking-widest">
        Syncing Neural State...
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
