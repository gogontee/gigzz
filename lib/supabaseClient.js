// utils/supabaseClient.js
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

// ---------- Frontend client ----------
export const supabase = createPagesBrowserClient();
export const createBrowserClient = () => createPagesBrowserClient();

// ---------- Server-only client (service role) ----------
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL; // <-- no NEXT_PUBLIC_ prefix
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase URL or service role key missing");
  return createClient(url, key, { auth: { persistSession: false } });
}
