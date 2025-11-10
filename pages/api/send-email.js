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
    const { email, type } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!["signup", "reset"].includes(type))
      return res.status(400).json({ error: "Invalid email type" });

    // Optional: check user exists before sending reset
    if (type === "reset") {
      let userFound = false;

      const { data: applicant } = await supabaseAdmin
        .from("applicants")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      const { data: employer } = await supabaseAdmin
        .from("employers")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (applicant || employer) userFound = true;

      if (!userFound) {
        return res.status(400).json({ error: "No user found with this email" });
      }
    }

    const redirectTo =
      type === "signup"
        ? "https://mygigzz.com/auth/confirm-signup"
        : "https://mygigzz.com/auth/update-password";

    const subject =
      type === "signup"
        ? "Confirm your Gigzz account"
        : "Reset your Gigzz password";

    const supabaseType = type === "signup" ? "signup" : "recovery";

    const { data, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: supabaseType,
        email,
        options: { redirectTo },
      });

    if (linkError) {
      console.error("Supabase generateLink error:", linkError);
      return res.status(400).json({ error: linkError.message });
    }

    const actionUrl = data?.properties?.action_link;
    if (!actionUrl) {
      return res.status(400).json({ error: "Missing action link" });
    }

    const html =
      type === "signup"
        ? `<div style="font-family: Arial, sans-serif;">
             <h2>Welcome to Gigzz!</h2>
             <p>Click below to confirm your account:</p>
             <a href="${actionUrl}" style="
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
             <a href="${actionUrl}" style="
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

    await resend.emails.send({
      from: "hello@mygigzz.com",
      to: email,
      subject,
      html,
    });

    return res.status(200).json({ message: `${type} email sent successfully` });
  } catch (err) {
    console.error("Resend/Supabase error:", err);
    return res.status(500).json({ error: err.message || "Failed to send email" });
  }
}
