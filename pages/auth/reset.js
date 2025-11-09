"use client";

import { useState } from "react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "reset" }), // ✅ type = reset
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("✅ Password reset link sent. Check your email.");
      } else {
        setStatus(`❌ ${data.error || "Something went wrong."}`);
      }
    } catch (err) {
      console.error("Reset error:", err);
      setStatus("❌ Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6">
        <div className="text-center mb-6">
          <img
            src="https://mygigzz.com/images/gigzzblack.png"
            alt="Gigzz Logo"
            className="w-24 mx-auto"
          />
          <h1 className="text-2xl font-bold mt-3">Reset Password</h1>
          <p className="text-gray-600 text-sm mt-1">
            Enter your email to receive a password reset link.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-600"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded text-white font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-orange-600"
            }`}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {status && (
          <p
            className={`mt-4 text-center text-sm ${
              status.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
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
