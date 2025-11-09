"use client";

import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import JobPostForm from "../../components/client/JobPostForm";
import { motion } from "framer-motion";

export default function PostJobPage() {
  const user = useUser();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user role
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setRole(data?.role);
      }
      setLoading(false);
    };

    fetchRole();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">
          You must be logged in to post a job
        </h1>
        <p className="text-gray-600 mb-6">
          Please log in to access the job posting page.
        </p>
        <button
          onClick={() => router.push("/auth/login")}
          className="px-6 py-2 bg-black text-white rounded hover:bg-orange-500 transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // Logged in but not employer
  if (role !== "employer") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            Kindly log in as a <span className="font-semibold">Client</span> to
            list a job.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push("/auth/login")}
              className="px-6 py-2 bg-black text-white rounded hover:bg-orange-500 transition"
            >
              Go to Login
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Employer: show job form
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6 md:p-12"
      >
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
          Post a New Job
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Fill in the details below to create a new job posting. Make sure to
          provide accurate information to attract the best candidates.
        </p>

        {/* Post Job Form */}
        <JobPostForm
          employerId={user.id}
          onPosted={() => router.push("/dashboard/employer")}
        />
      </motion.div>
    </div>
  );
}
