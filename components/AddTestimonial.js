"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../utils/supabaseClient";

export default function AddTestimonial() {
  const [testimony, setTestimony] = useState("");
  const [popup, setPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const handleAddTestimonial = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setPopup(true);
      setLoading(false);
      return;
    }

    // Check how many testimonials this user already has
    const { count, error: countError } = await supabase
      .from("testimonials")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      console.error("Error checking testimonial count:", countError.message);
      setLoading(false);
      return;
    }

    if (count >= 5) {
      setLimitReached(true);
      setLoading(false);
      return;
    }

    // Fetch the user's full_name and avatar from applicants or employers
    let fullName = "Anonymous";
    let avatarUrl = null;

    // Check both tables
    const { data: applicantData } = await supabase
      .from("applicants")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (applicantData) {
      fullName = applicantData.full_name || "Anonymous";
      avatarUrl = applicantData.avatar_url || null;
    } else {
      const { data: employerData } = await supabase
        .from("employers")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();
      if (employerData) {
        fullName = employerData.name || "Anonymous";
        avatarUrl = employerData.avatar_url || null;
      }
    }

    // Prepare payload
    const payload = {
      user_id: user.id,
      full_name: fullName,
      avatar_url: avatarUrl,
      testimony,
      approved: false,
    };

    console.log("Inserting testimonial payload:", payload);

    // Insert testimonial
    const { error } = await supabase.from("testimonials").insert(payload);

    setLoading(false);

    if (error) {
      console.error("Error adding testimonial:", error.message);
    } else {
      setTestimony("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-2xl shadow-lg mt-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Add Your Testimonial</h2>
      <form onSubmit={handleAddTestimonial} className="space-y-4">
        <textarea
          value={testimony}
          onChange={(e) => setTestimony(e.target.value)}
          maxLength={300}
          placeholder="Write your testimonial (max 300 chars)"
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
          required
        />
        <button
          type="submit"
          disabled={loading || testimony.trim() === ""}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg shadow-md transition disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Testimonial"}
        </button>
      </form>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-center"
          >
            ✅ Testimonial submitted! Waiting for approval.
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {popup && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-4 border z-50 max-w-xs text-center"
          >
            <p className="text-gray-800 font-medium">Please log in to add a testimonial 🙏</p>
            <button
              onClick={() => setPopup(false)}
              className="mt-2 px-4 py-1 bg-orange-500 text-white rounded-lg"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {limitReached && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-center"
          >
            ⚠️ You can only submit up to 5 testimonials.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
