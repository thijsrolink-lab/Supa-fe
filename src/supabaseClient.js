import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars ontbreken. Zet VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY " +
    "in een .env bestand (lokaal) of in de Netlify site-instellingen (build)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
