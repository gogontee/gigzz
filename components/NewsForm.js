"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import "react-quill/dist/quill.snow.css";

// Supabase client (for browser)
const supabase = createPagesBrowserClient();

// Dynamically import ReactQuill to prevent SSR errors
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function NewsForm({ onSuccess }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [photo, setPhoto] = useState(null); // 👈 file input
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    if (!title || !slug || !content) {
      setErrorMsg("All fields are required.");
      setLoading(false);
      return;
    }

    let photoUrl = null;

    // ✅ Upload photo if selected
    if (photo) {
      try {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `news/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("news") // your bucket name
          .upload(filePath, photo);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("news")
          .getPublicUrl(filePath);

        photoUrl = urlData.publicUrl;
      } catch (err) {
        console.error("Photo upload error:", err);
        setErrorMsg("Failed to upload photo. Try again.");
        setLoading(false);
        return;
      }
    }

    // ✅ Insert into news table
    const { error } = await supabase.from("news").insert([
      {
        title,
        slug,
        content,
        photo: photoUrl, // save uploaded photo URL (or null)
      },
    ]);

    if (error) {
      console.error(error);
      setErrorMsg("Error inserting news. Please try again.");
    } else {
      setSuccessMsg("News added successfully!");
      setTitle("");
      setSlug("");
      setContent("");
      setPhoto(null);
      
      // Call onSuccess callback after successful submission
      if (onSuccess) {
        onSuccess();
      }
    }
    setLoading(false);
  };

  // Full toolbar options for formatting
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }, { size: [] }],
      ["link", "image", "video", "code-block"],
      ["clean"],
    ],
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

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">Title *</label>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Enter news title"
          required
        />
      </div>

      {/* Slug */}
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
          placeholder="news-article-title"
          required
        />
        <p className="text-xs text-gray-500">
          This will be used in the URL. Auto-generated from title, but you can customize it.
        </p>
      </div>

      {/* Photo Upload */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">Featured Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files[0])}
          className="border border-gray-300 rounded px-4 py-2"
        />
        {photo && (
          <p className="text-sm text-green-600">
            Selected: {photo.name}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">Content *</label>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          placeholder="Write your news content here..."
          className="bg-white border border-gray-300 rounded mb-12" // Added margin for button space
        />
      </div>

      <div className="flex gap-4 mt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-6 py-2 rounded hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Add News"}
        </button>
        
        <button
          type="button"
          onClick={() => {
            setTitle("");
            setSlug("");
            setContent("");
            setPhoto(null);
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