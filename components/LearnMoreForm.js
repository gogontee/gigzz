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

export default function LearnMoreForm({ onSuccess }) {
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
      
      // Call onSuccess callback after successful submission
      if (onSuccess) {
        onSuccess();
      }
    }
    setLoading(false);
  };

  // Function to generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Auto-generate slug when title changes
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Auto-generate slug if slug is empty or matches the previously generated slug
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
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
      {successMsg && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="font-semibold">Title *</label>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Enter title"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-semibold">
          Slug * 
          <span className="text-sm text-gray-500 ml-2">(URL-friendly identifier)</span>
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="learn-more-title"
          required
        />
        <p className="text-xs text-gray-500">
          This will be used in the URL. Auto-generated from title, but you can customize it.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-semibold">Content *</label>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          placeholder="Write your content here..."
          className="bg-white border border-gray-300 rounded mb-12" // Added margin for button space
        />
      </div>

      <div className="flex gap-4 mt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-6 py-2 rounded hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Add Content"}
        </button>
        
        <button
          type="button"
          onClick={() => {
            setTitle("");
            setSlug("");
            setContent("");
            setErrorMsg("");
            setSuccessMsg("");
          }}
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition"
        >
          Clear Form
        </button>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>* Required fields</p>
      </div>
    </form>
  );
}