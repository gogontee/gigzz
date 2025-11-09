import { supabase } from "./supabaseClient"; // adjust path if your supabaseClient.js is elsewhere

export async function logUserActivity({
  user_id,
  action,
  query = null,
  job_id = null,
  meta = null,
}) {
  const { data, error } = await supabase
    .from("user_activity")
    .insert([
      {
        user_id,
        action,
        query,
        job_id,
        meta,
      },
    ]);

  if (error) {
    console.error("Failed to insert user_activity:", error);
  } else {
    console.log("User activity logged:", data);
  }

  return { data, error };
}
