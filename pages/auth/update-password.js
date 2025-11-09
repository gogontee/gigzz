"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function init() {
      // Grab the access_token from the URL
      const { access_token } = router.query;

      if (!access_token) {
        setStatus("❌ Reset link invalid or missing token.");
        setLoading(false);
        return;
      }

      // Set session with the token
      const { error } = await supabase.auth.setSession({ access_token });

      if (error) {
        setStatus(`❌ ${error.message}`);
      }

      setLoading(false);
    }

    // Only run after router is ready
    if (router.isReady) init();
  }, [router.isReady, router.query]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setStatus("");

    if (password !== confirmPassword) {
      setStatus("❌ Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus(`❌ ${error.message}`);
    } else {
      setSuccess(true);
      setStatus("✅ Password updated successfully!");
      setTimeout(() => router.push("/auth/login"), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-700">
        Checking reset link...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="p-6 w-full max-w-md bg-white rounded-xl shadow-md relative">
        <div className="text-center mb-6">
          <img src="https://mygigzz.com/images/gigzzblack.png" className="w-24 mx-auto" />
          <h1 className="text-2xl font-bold mt-3">Set a New Password</h1>
        </div>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-0 left-0 w-full h-full bg-white rounded-xl flex flex-col items-center justify-center z-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <p className="mt-4 text-lg font-semibold text-green-600">{status}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!success && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border px-4 py-2 rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.04.164-2.041.475-3M3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border px-4 py-2 rounded"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded hover:bg-orange-600 transition font-semibold"
            >
              Update Password
            </button>
          </form>
        )}

        {!success && status && (
          <p className="mt-4 text-center text-sm text-gray-700">{status}</p>
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
