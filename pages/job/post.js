"use client";

import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import JobPostForm from "../../components/client/JobPostForm";
import { motion } from "framer-motion";

export default function PostJobPage() {
  const user = useUser();
  const router = useRouter();

  // Redirect if not logged in
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
          Fill in the details below to create a new job posting. Make sure to provide accurate information to attract the best candidates.
        </p>

        {/* Post Job Form */}
        <JobPostForm employerId={user.id} onPosted={() => router.push("/dashboard/employer")} />
      </motion.div>
    </div>
  );
}
