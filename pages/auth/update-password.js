"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check for custom token in query parameters (from your Resend email)
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    console.log("🔍 URL Parameters:", { token, email });

    if (!token || !email) {
      setStatus("❌ Reset link invalid or missing token.");
      return;
    }

    // For custom tokens, we don't need to set a Supabase session
    // Just validate that we have the required parameters
    setStatus("✅ Please enter your new password.");
    
  }, [searchParams]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    if (password !== confirmPassword) {
      setStatus("❌ Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setStatus("❌ Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      // Since we're using custom tokens, we need to handle this differently
      // Option 1: Try to get current session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User has an active session, update password directly
        const { error } = await supabase.auth.updateUser({ 
          password: password 
        });

        if (error) throw error;

        setSuccess(true);
        setStatus("✅ Password updated successfully!");
        
        // Sign out and redirect
        await supabase.auth.signOut();
        setTimeout(() => router.push("/auth/login"), 2000);
        
      } else {
        // Option 2: No session - user needs to sign in first
        // For now, show a message to use Supabase's official reset
        setStatus("❌ Please use the official password reset link sent by Supabase.");
        
        // Alternative: You could implement your own password reset logic here
        // by verifying the custom token against your database
      }

    } catch (error) {
      console.error("Update password error:", error);
      setStatus(`❌ ${error.message || "Failed to update password"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="p-6 w-full max-w-md bg-white rounded-xl shadow-md relative">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="https://mygigzz.com/images/gigzzblack.png"
            className="w-24 mx-auto"
            alt="Gigzz Logo"
          />
          <h1 className="text-2xl font-bold mt-3">Set a New Password</h1>
        </div>

        {/* Success Message */}
        {success && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-green-600">{status}</p>
            <p className="text-gray-600 mt-2">Redirecting to login...</p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.04.164-2.041.475-3M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded hover:bg-orange-600 transition font-semibold disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        {/* Status Message */}
        {!success && status && (
          <p className={`mt-4 text-center text-sm ${status.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>
            {status}
          </p>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          <a href="/auth/login" className="text-orange-600 hover:underline">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}