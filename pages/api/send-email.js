import { Resend } from "resend";

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

    // Generate a unique token for reset
    const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const resetUrl = `${process.env.NEXTAUTH_URL || 'https://mygigzz.com'}/auth/update-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send custom email with Resend
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://mygigzz.com/images/gigzzblack.png" alt="Gigzz Logo" style="width: 120px; height: auto;" />
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #000; text-align: center; margin-bottom: 20px;">Reset Your Password</h2>
          
          <p style="color: #666; text-align: center; margin-bottom: 25px;">
            You requested to reset your password. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="
              background: #000; 
              color: white; 
              padding: 14px 32px; 
              text-decoration: none; 
              border-radius: 6px;
              display: inline-block;
              font-weight: bold;
              font-size: 16px;
            ">Reset Password</a>
          </div>
          
          <p style="color: #666; text-align: center; font-size: 14px; margin-bottom: 10px;">
            Or copy and paste this link in your browser:
          </p>
          <p style="text-align: center; margin: 0;">
            <a href="${resetUrl}" style="color: #000; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            If you didn't request this password reset, please ignore this email.
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: "hello@mygigzz.com",
      to: email,
      subject: "Reset Your Gigzz Password",
      html,
    });

    return res.status(200).json({ message: "Password reset email sent" });

  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message || "Failed to send reset email" });
  }
}