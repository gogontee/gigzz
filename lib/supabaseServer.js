import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// Use this in /app/api/* route handlers
export const supabaseApi = (req) => {
  return createRouteHandlerClient({ cookies });
};
