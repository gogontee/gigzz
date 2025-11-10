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
    
    const subject = "Confirm your Gigzz account - Action required";
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Gigzz Account</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
    <div style="background: #ffffff; border-radius: 12px; padding: 40px 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        
        <!-- Header with Your Logo -->
        <div style="text-align: center; padding: 20px 0 30px 0;">
            <img 
                src="https://mygigzz.com/images/gigzzblack.png" 
                alt="Gigzz" 
                style="max-width: 120px; height: auto;"
            />
            <h2 style="color: #000000; margin: 20px 0 10px 0; font-size: 24px;">Verify Your Email Address</h2>
        </div>

        <!-- Content -->
        <div style="color: #333333; line-height: 1.6; margin-bottom: 25px;">
            <p>Hello${firstName ? ` ${firstName}` : ''},</p>
            
            <p>Thank you for creating a Gigzz account. We're excited to have you join our community of talented creatives and clients.</p>
            
            <p>To complete your registration and start exploring opportunities, please verify your email address by clicking the button below:</p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="${verificationUrl}" 
                   style="background: #000000; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; letter-spacing: 0.5px;">
                    Verify Email Address
                </a>
            </div>

            <p style="color: #666666; font-size: 14px; text-align: center;">
                This verification link will expire in 24 hours.
            </p>

            <!-- Fallback Link -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
                    <strong>Alternative:</strong> If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="word-break: break-all; font-size: 13px; color: #000; margin: 0;">
                    ${verificationUrl}
                </p>
            </div>
        </div>

        <!-- Security Notice -->
        <div style="background: #f8f9fa; border-left: 4px solid #000000; padding: 15px; margin: 25px 0;">
            <p style="color: #666666; margin: 0; font-size: 14px;">
                <strong>Note:</strong> This email was sent because someone signed up for Gigzz with this email address. If this wasn't you, please disregard this message.
            </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #eeeeee; padding: 25px 0 0 0; text-align: center;">
            <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                If you have any questions, contact our support team at 
                <a href="mailto:support@mygigzz.com" style="color: #000000;">support@mygigzz.com</a>
            </p>
            <p style="color: #999999; font-size: 12px; margin: 0;">
                Gigzz Inc., 10 Admiralty Way, Lekki, Lagos 10001<br>
                <a href="https://mygigzz.com/privacy" style="color: #999999; text-decoration: none;">Privacy Policy</a> • 
                <a href="https://mygigzz.com/terms" style="color: #999999; text-decoration: none;">Terms of Service</a>
            </p>
        </div>
    </div>
</body>
</html>
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