import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Use anon key, not service role
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, type } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!["signup", "reset"].includes(type))
      return res.status(400).json({ error: "Invalid email type" });

    // For reset password, use the client-side reset method
    if (type === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXTAUTH_URL || 'https://mygigzz.com'}/auth/update-password`,
      });

      if (error) {
        console.error("Reset password error:", error);
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ message: "Password reset email sent" });
    }

    // Keep your existing signup logic
    if (type === "signup") {
      const redirectTo = "https://mygigzz.com/auth/confirm-signup";
      
      const { data, error: linkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (linkError) {
        console.error("Signup link error:", linkError);
        return res.status(400).json({ error: linkError.message });
      }

      return res.status(200).json({ message: "Signup email sent" });
    }

  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message || "Failed to send email" });
  }
}