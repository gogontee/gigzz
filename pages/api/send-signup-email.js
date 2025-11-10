// pages/api/send-signup-email.js
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, firstName, verificationToken } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!verificationToken) return res.status(400).json({ error: "Verification token is required" });

    // Create verification URL with your token
    const verificationUrl = `https://mygigzz.com/auth/verify-email?token=${verificationToken}`;
    
    const subject = "Verify your Gigzz account";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Gigzz${firstName ? `, ${firstName}` : ''}!</h2>
        <p style="color: #666; line-height: 1.6;">
          Thank you for signing up! Please verify your email address to activate your account.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="
            display: inline-block;
            padding: 12px 30px;
            background: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          ">Verify Email Address</a>
        </div>
        <p style="color: #666; line-height: 1.6;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
          ${verificationUrl}
        </p>
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          If you didn't create an account, please ignore this email.
        </p>
      </div>
    `;

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "hello@mygigzz.com",
      to: email,
      subject,
      html,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return res.status(400).json({ error: emailError.message });
    }

    return res.status(200).json({ message: "Verification email sent successfully" });
  } catch (err) {
    console.error("Resend/Supabase error:", err);
    return res.status(500).json({ error: err.message || "Failed to send email" });
  }
}