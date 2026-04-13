import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase URL or Anon Key is missing. Check your .env file.");
}

// Only initialize if keys are present to prevent module-level crash on build
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null as any; 
