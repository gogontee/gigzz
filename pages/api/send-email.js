import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Generate reset link with Supabase
    const { error: linkError, data } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXTAUTH_URL || 'https://mygigzz.com'}/auth/update-password`,
    });

    if (linkError) {
      console.error("Reset password error:", linkError);
      return res.status(400).json({ error: linkError.message });
    }

    // Send custom email with Resend
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Reset your Gigzz password</h2>
        <p>Click below to reset your password:</p>
        <a href="${data?.properties?.action_link || 'https://mygigzz.com/auth/update-password'}" style="
          display:inline-block;
          padding:10px 20px;
          background:#000;
          color:#fff;
          text-decoration:none;
          border-radius:6px;
          margin-top:10px;
        ">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    await resend.emails.send({
      from: "hello@mygigzz.com",
      to: email,
      subject: "Reset your Gigzz password",
      html,
    });

    return res.status(200).json({ message: "Password reset email sent" });

  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message || "Failed to send reset email" });
  }
}