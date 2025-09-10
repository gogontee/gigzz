// utils/supabaseClient.js
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

// ✅ This automatically uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// from your environment variables — you don’t need to pass them manually.
export const supabase = createPagesBrowserClient();
