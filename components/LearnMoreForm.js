"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@supabase/supabase-js";
import "react-quill/dist/quill.snow.css";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Dynamically import ReactQuill (no SSR)
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function LearnMoreForm() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    // Basic validation
    if (!title || !slug || !content) {
      setErrorMsg("All fields are required.");
      setLoading(false);
      return;
    }

    // Insert into learn_more table
    const { data, error } = await supabase.from("learn_more").insert([
      {
        title,
        slug,
        content,
      },
    ]);

    if (error) {
      console.error(error);
      setErrorMsg("Error inserting content. Please try again.");
    } else {
      setSuccessMsg("Content added successfully!");
      setTitle("");
      setSlug("");
      setContent("");
    }
    setLoading(false);
  };

  // ReactQuill toolbar options
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      ["link", "image", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {successMsg && <p className="text-green-600">{successMsg}</p>}
      {errorMsg && <p className="text-red-600">{errorMsg}</p>}

      <div className="flex flex-col gap-1">
        <label className="font-semibold">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Enter title"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-semibold">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Enter slug (url-friendly)"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-semibold">Content</label>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          placeholder="Write your content here..."
          className="bg-white border border-gray-300 rounded"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded hover:bg-orange-500 transition"
      >
        {loading ? "Submitting..." : "Add Content"}
      </button>
    </form>
  );
}
