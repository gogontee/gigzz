// utils/supabaseClient.js
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

// ✅ Keep your existing imports working
export const supabase = createPagesBrowserClient();

// ✅ Add this as an alternative for new components
export const createClient = () => createPagesBrowserClient();