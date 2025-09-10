'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../utils/supabaseClient";

export default function ProfileCard({ id }) {
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // ✅ Get the logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchApplicant = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("applicants")
        .select("id, avatar_url, full_name, city, state, specialties")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("❌ Error fetching applicant:", error);
      }

      if (data) {
        // If avatar_url is a storage path, generate a public URL
        let avatarUrl = data.avatar_url;
        if (avatarUrl && !avatarUrl.startsWith("http")) {
          const { data: publicUrlData } = supabase
            .storage
            .from("applicantasset/avatars")
            .getPublicUrl(avatarUrl);

          avatarUrl = publicUrlData?.publicUrl || null;
        }

        setApplicant({
          ...data,
          avatar_url: avatarUrl || "/default-avatar.png",
        });
      }

      setLoading(false);
    };

    fetchApplicant();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse mb-3" />
        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mb-2" />
        <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col items-center text-center">
        <p className="text-sm text-gray-500">No applicant found or access denied</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col items-center text-center">
      {/* Avatar */}
      <img
        src={applicant.avatar_url}
        alt={applicant.full_name || "Applicant"}
        className="w-24 h-24 rounded-full object-cover mb-3"
      />

      {/* Full Name */}
      <h2 className="text-lg font-semibold text-gray-900">
        {applicant.full_name || "Unnamed Applicant"}
      </h2>

      {/* Specialties */}
      {applicant.specialties && (
        <p className="text-sm text-gray-600">{applicant.specialties}</p>
      )}

      {/* Location */}
      {(applicant.state || applicant.city) && (
        <p className="text-xs text-gray-500 mt-1">
          {[applicant.state, applicant.city].filter(Boolean).join(", ")}
        </p>
      )}

      {/* ✅ Conditional View Button */}
      {currentUserId === applicant.id ? (
        <Link href="/profile" className="text-sm text-blue-600 hover:underline">
          View Profile
        </Link>
      ) : (
        <Link href={`/dashboard/profile/${id}`} className="text-sm text-blue-600 hover:underline">
          View Profile
        </Link>
      )}
    </div>
  );
}
