// pages/dashboard/employer/edit.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Image from "next/image";
import { supabase } from "../../../utils/supabaseClient"; // single client

export default function EditEmployerProfile() {
  const [employer, setEmployer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [idCardFile, setIdCardFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  // Fetch employer profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return router.push("/auth/login");

        const { data, error } = await supabase
          .from("employers")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Fetch employer error:", error.message);
        } else {
          setEmployer(data);
        }
      } catch (err) {
        console.error("Unexpected fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleChange = (e) => setEmployer({ ...employer, [e.target.name]: e.target.value });
  const handleAvatarChange = (e) => setAvatarFile(e.target.files[0]);
  const handleIdCardChange = (e) => setIdCardFile(e.target.files[0]);

  // Upload file to Supabase storage
  const uploadFile = async (file) => {
  if (!file || !employer) return null;

  const fileExt = file.name.split(".").pop();
  const fileName = `${employer.id}.${fileExt}`;
  const filePath = `clients_asset/${fileName}`; // direct under clients_asset

  const { error: uploadError } = await supabase.storage
    .from("assets")
    .upload(filePath, file, { cacheControl: "3600", upsert: true });

  if (uploadError) {
    console.error("Upload error:", uploadError.message);
    return null;
  }

  const { data } = supabase.storage.from("assets").getPublicUrl(filePath);
  return data.publicUrl;
};


  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!employer) return;

    setUpdating(true);

    let avatar_url = employer.avatar_url;
    let id_card_url = employer.id_card_url;

    if (avatarFile) {
      const url = await uploadFile(avatarFile, "avatars");
      if (url) avatar_url = url;
    }

    if (idCardFile) {
      const url = await uploadFile(idCardFile, "id_cards");
      if (url) id_card_url = url;
    }

    const { data, error } = await supabase
      .from("employers")
      .update({
        name: employer.name,
        company: employer.company,
        phone: employer.phone,
        email: employer.email,
        bio: employer.bio,
        avatar_url,
        id_card_url,
      })
      .eq("id", employer.id)
      .select(); // fetch updated row

    setUpdating(false);

    if (error) {
      console.error("Update employer error:", error.message);
      alert("Failed to update profile. Check console for details.");
    } else if (data && data.length > 0) {
      setEmployer(data[0]);
      alert("Profile updated successfully!");
      router.push("/dashboard/employer");
    } else {
      alert("Update failed: no rows affected (check RLS policies).");
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <motion.div
      className="min-h-screen p-4 bg-white text-black"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-2xl font-bold mb-6">Edit Employer Profile</h1>

      <form onSubmit={handleUpdate} className="space-y-6">
        {["name", "company", "phone", "email", "bio"].map((field) => (
          <div key={field}>
            <label className="block font-medium mb-1 capitalize">{field}</label>
            {field === "bio" ? (
              <textarea
                name={field}
                rows={3}
                value={employer[field] || ""}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-green-800 focus:outline-none"
              />
            ) : (
              <input
                type="text"
                name={field}
                value={employer[field] || ""}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-green-800 focus:outline-none"
              />
            )}
          </div>
        ))}

        <div>
          <label className="block font-medium mb-1">Avatar</label>
          {employer.avatar_url && (
            <Image
              src={employer.avatar_url}
              width={100}
              height={100}
              alt="Avatar"
              className="rounded-full mb-2"
            />
          )}
          <input type="file" accept="image/*" onChange={handleAvatarChange} />
        </div>

        <div>
          <label className="block font-medium mb-1">ID Card</label>
          {employer.id_card_url && (
            <Image
              src={employer.id_card_url}
              width={200}
              height={100}
              alt="ID Card"
              className="rounded-lg mb-2"
            />
          )}
          <input type="file" accept="image/*,.pdf" onChange={handleIdCardChange} />
        </div>

        <button
          type="submit"
          disabled={updating}
          className="w-full bg-black text-white py-3 rounded-xl hover:bg-green-800 transition-all"
        >
          {updating ? "Updating..." : "Save Changes"}
        </button>
      </form>
    </motion.div>
  );
}
