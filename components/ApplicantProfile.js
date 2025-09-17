// components/ApplicantProfile.js
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient"; // ✅ use your shared client

export default function ApplicantProfile({ applicantId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!applicantId) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("applicants")
        .select("*")
        .eq("id", applicantId)
        .single();

      if (error) {
        console.error("Error fetching applicant:", error.message);
      } else {
        setProfile(data);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [applicantId]);

  if (loading) return <p className="p-4">Loading profile...</p>;
  if (!profile) return <p className="p-4 text-red-500">Profile not found.</p>;

  return (
    <div className="p-4 bg-white shadow rounded-xl">
      <div className="flex items-center space-x-4">
        <img
          src={profile.avatar_url || "/default-avatar.png"}
          alt="Avatar"
          className="w-16 h-16 rounded-full object-cover"
        />
        <div>
          <h2 className="text-lg font-bold">{profile.full_name}</h2>
          <p className="text-sm text-gray-600">{profile.email}</p>
        </div>
      </div>

      <div className="mt-4">
        <p>
          <span className="font-semibold">Specialties:</span>{" "}
          {profile.specialties || "Not specified"}
        </p>
        <p className="mt-2">
          <span className="font-semibold">Phone:</span>{" "}
          {profile.phone || "N/A"}
        </p>
        <p className="mt-2">
          <span className="font-semibold">Bio:</span>{" "}
          {profile.bio || "No bio provided."}
        </p>
      </div>
    </div>
  );
}
