"use client";

import { useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function AddTestimonial({ onSuccess }) {
  const [testimony, setTestimony] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);

  const handleAddTestimonial = async (e) => {
    e.preventDefault();
    setLoading(true);

    // ✅ Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoginRequired(true);
      setLoading(false);
      return;
    }

    // ✅ Check how many testimonials this user already has
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

    // ✅ Fetch the user's full_name and avatar
    let fullName = "Anonymous";
    let avatarUrl = null;

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

    // ✅ Prepare payload
    const payload = {
      user_id: user.id,
      full_name: fullName,
      avatar_url: avatarUrl,
      testimony,
      approved: false,
    };

    // ✅ Insert testimonial
    const { error } = await supabase.from("testimonials").insert(payload);

    setLoading(false);

    if (error) {
      console.error("Error adding testimonial:", error.message);
    } else {
      setTestimony("");
      setSuccess(true);

      // Auto close modal if parent passed onSuccess
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        Add Your Testimonial
      </h2>

      {/* ✅ Alerts directly inside form */}
      {success && (
        <div className="mb-3 p-2 text-sm text-green-700 bg-green-100 border border-green-300 rounded">
          ✅ Testimonial submitted! Waiting for approval.
        </div>
      )}

      {loginRequired && (
        <div className="mb-3 p-2 text-sm text-yellow-700 bg-yellow-100 border border-yellow-300 rounded">
          ⚠️ Please log in to add a testimonial.
        </div>
      )}

      {limitReached && (
        <div className="mb-3 p-2 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
          ⚠️ You can only submit up to 5 testimonials.
        </div>
      )}

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
    </div>
  );
}
