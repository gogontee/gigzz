// pages/api/custom-signup.js
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Initialize with error handling
let supabaseAdmin;
let resend;

try {
  supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  resend = new Resend(process.env.RESEND_API_KEY);
} catch (error) {
  console.error("Initialization error:", error);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, firstName, lastName, role, country, state, city } = req.body;

    console.log("🔄 Starting signup for:", email);

    // 1. Check if user exists
    try {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (!listError && users) {
        const userExists = users.some(user => user.email === email);
        if (userExists) {
          return res.status(400).json({ error: "An account with this email already exists. Please sign in instead." });
        }
      }
    } catch (checkError) {
      console.log("User check failed, continuing...");
    }

    // 2. Create user in Auth
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role,
      }
    });

    if (signUpError) {
      console.error("❌ Auth creation failed:", signUpError);
      return res.status(400).json({ error: signUpError.message });
    }

    const userId = authData.user.id;
    const userRole = role === 'client' ? 'employer' : 'applicant';
    const fullName = `${firstName} ${lastName}`;

    console.log("✅ User created:", userId);

    // 3. Generate verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // 4. Insert into users table
    try {
      await supabaseAdmin
        .from('users')
        .insert([{
          id: userId,
          role: userRole,
          email_verified: false
        }]);
      console.log("✅ Users table updated");
    } catch (userError) {
      console.log("⚠️ Users table insert failed:", userError.message);
    }

    // 5. Insert into profile table
    try {
      const profileTable = userRole === 'employer' ? 'employers' : 'applicants';
      
      const profileData = {
        id: userId,
        email: email,
        ...(userRole === 'applicant' 
          ? { full_name: fullName, country, state, city }
          : { name: fullName, country, state, city }
        )
      };

      await supabaseAdmin
        .from(profileTable)
        .insert([profileData]);
      console.log("✅ Profile table updated");
    } catch (profileError) {
      console.log("⚠️ Profile table insert failed:", profileError.message);
    }

    // 6. Store verification token
    try {
      await supabaseAdmin
        .from('email_verifications')
        .insert([{
          user_id: userId,
          email: email,
          token: verificationToken,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          user_role: userRole
        }]);
      console.log("✅ Verification token stored");
    } catch (verificationError) {
      console.log("⚠️ Verification storage failed:", verificationError.message);
    }

    // 7. Send verification email via Resend - UPDATED WITH DETAILED LOGGING
    let emailSent = false;
    let emailErrorDetails = null;
    
    try {
      // Use environment variable for the base URL
const baseUrl = process.env.NEXTAUTH_URL || 'https://mygigzz.com';
const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`;
      
      console.log("📧 Attempting to send email to:", email);
      console.log("📧 Using from address: hello@mygigzz.com");
      
      const { data, error } = await resend.emails.send({
        from: "hello@mygigzz.com",
        to: email,
        subject: "Verify your Gigzz account",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to Gigzz, ${firstName}!</h2>
            <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="
                background: #000; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 6px;
                display: inline-block;
              ">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p>${verificationUrl}</p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
        `,
      });

      if (error) {
        // 🔍 DETAILED ERROR LOGGING ADDED HERE
        console.error("❌ RESEND API ERROR DETAILS:");
        console.error("   - Error name:", error.name);
        console.error("   - Error message:", error.message);
        console.error("   - Full error object:", JSON.stringify(error, null, 2));
        emailErrorDetails = error;
      } else {
        emailSent = true;
        console.log("✅ Verification email sent successfully!");
        console.log("   - Email ID:", data?.id);
        console.log("   - To:", email);
      }
    } catch (emailError) {
      console.error("❌ UNEXPECTED EMAIL SENDING ERROR:");
      console.error("   - Error:", emailError);
      console.error("   - Stack:", emailError.stack);
      emailErrorDetails = emailError;
    }

    // SUCCESS response - UPDATED TO INCLUDE ERROR DETAILS
    return res.status(200).json({ 
      success: true, 
      message: emailSent 
        ? "Account created successfully! Check your email for verification." 
        : "Account created! Email verification failed - please contact support.",
      userId: userId,
      emailSent: emailSent,
      // Include error details for debugging
      ...(emailErrorDetails && { emailError: emailErrorDetails.message })
    });

  } catch (err) {
    console.error("💥 FATAL SERVER ERROR:", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}