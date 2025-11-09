// pages/api/send-email.js
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// ✅ Server-side Supabase client (service role key only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Resend email client
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, type } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!type || !["signup", "reset"].includes(type)) {
      return res.status(400).json({ error: "Invalid email type" });
    }

    // Determine redirect URL and email subject
    const redirectTo =
      type === "signup"
        ? "https://gigzz.com/auth/confirm-signup"
        : "https://gigzz.com/auth/update-password";

    const subject =
      type === "signup"
        ? "Confirm your Gigzz account"
        : "Reset your Gigzz password";

    // Map frontend type to Supabase type
    const supabaseType = type === "signup" ? "signup" : "recovery";

    // Generate Supabase magic link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: supabaseType,
      email,
      options: { redirectTo },
    });

    if (error) throw error;

    // Compose HTML email
    const html = type === "signup"
      ? `<div style="font-family: Arial, sans-serif;">
           <h2>Welcome to Gigzz!</h2>
           <p>Click below to confirm your account:</p>
           <a href="${data?.properties?.action_link}" style="
             display:inline-block;
             padding:10px 20px;
             background:#000;
             color:#fff;
             text-decoration:none;
             border-radius:6px;
             margin-top:10px;
           ">Confirm Account</a>
           <p>If you didn’t create an account, ignore this email.</p>
         </div>`
      : `<div style="font-family: Arial, sans-serif;">
           <h2>Reset your Gigzz password</h2>
           <p>Click below to reset your password:</p>
           <a href="${data?.properties?.action_link}" style="
             display:inline-block;
             padding:10px 20px;
             background:#000;
             color:#fff;
             text-decoration:none;
             border-radius:6px;
             margin-top:10px;
           ">Reset Password</a>
           <p>If you didn’t request this, ignore this email.</p>
         </div>`;

    // Send email via Resend
    await resend.emails.send({
      from: "Gigzz <no-reply@gigzz.com>",
      to: email,
      subject,
      html,
    });

    return res.status(200).json({ message: `${type} email sent successfully` });
  } catch (err) {
    console.error("Resend/Supabase error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to send email" });
  }
}
