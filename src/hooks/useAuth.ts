import { create } from "zustand";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  initialized: boolean;
  setUser: (user: User | null, session: Session | null) => void;
  setGuest: (isGuest: boolean) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  session: null,
  isGuest: false,
  initialized: false,
  setUser: (user, session) => set({ user, session, isGuest: false, initialized: true }),
  setGuest: (isGuest) => set({ isGuest, user: null, session: null, initialized: true }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isGuest: false });
  },
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user || null, session, initialized: true });

    // Set up real-time listener for auth changes
    supabase.auth.onAuthStateChange((_event, newSession) => {
      set({ user: newSession?.user || null, session: newSession });
    });
  }
}));
