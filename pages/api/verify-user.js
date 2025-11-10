import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Update auth user metadata using admin client
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { 
        user_metadata: { 
          email_verified: true
        } 
      }
    );

    if (authUpdateError) {
      console.error("Auth update error:", authUpdateError);
      return res.status(400).json({ error: authUpdateError.message });
    }

    return res.status(200).json({ success: true, message: "User verified successfully" });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}