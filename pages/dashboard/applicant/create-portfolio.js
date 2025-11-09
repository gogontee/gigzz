// components/ProjectForm.js (or pages/... whichever path you use)
"use client";

import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../../utils/supabaseClient";
import Footer from "../../../components/Footer";
import MobileHeader from "../../../components/MobileHeader";

// ReactQuill: dynamically imported to avoid SSR problems
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Quill toolbar modules & formats (you can adjust)
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ["link", "image", "video", "code-block"],
    ["clean"],
  ],
};
const quillFormats = [
  "header", "bold", "italic", "underline", "strike", "blockquote",
  "list", "bullet", "indent", "align",
  "color", "background", "link", "image", "video", "code-block"
];

export default function ProjectForm() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [galleries, setGalleries] = useState(
    Array(6).fill({ file: null, description: "", preview: null })
  );
  const [formData, setFormData] = useState({
    title: "",
    details: "", // will hold HTML from ReactQuill
    tags: "",
    visibility: "public",
    location: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [createdProject, setCreatedProject] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    };
    getUser();
  }, []);

  const handleGalleryChange = (index, type, value) => {
    const updated = [...galleries];
    updated[index] = {
      ...updated[index],
      [type]: value,
      ...(type === "file" ? { preview: URL.createObjectURL(value) } : {}),
    };
    setGalleries(updated);
  };

  const handleProfileChange = (file) => {
    setProfilePic(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showMessage("User not logged in!", "error");
      return;
    }
    if (
      !formData.title ||
      !profilePic ||
      !formData.details || // now HTML
      !formData.tags ||
      !formData.location
    ) {
      showMessage("Please fill in all required fields.", "error");
      return;
    }

    setLoading(true);

    try {
      const galleryUploads = {};
      for (let i = 0; i < galleries.length; i++) {
        const gallery = galleries[i];
        if (gallery.file) {
          const fileName = `gallery-${Date.now()}-${gallery.file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("project-assets")
            .upload(`user-${user.id}/projects/${fileName}`, gallery.file);
          if (uploadError) throw uploadError;

          const { data: publicUrlData, error: urlError } =
            supabase.storage
              .from("project-assets")
              .getPublicUrl(`user-${user.id}/projects/${fileName}`);
          if (urlError) throw urlError;

          galleryUploads[`gallery_image_${i + 1}`] =
            publicUrlData.publicUrl;
          galleryUploads[`gallery_desc_${i + 1}`] =
            gallery.description || "";
        }
      }

      let profileUrl = null;
      if (profilePic) {
        const fileName = `profile-${Date.now()}-${profilePic.name}`;
        const { error: uploadError } = await supabase.storage
          .from("project-assets")
          .upload(`user-${user.id}/projects/${fileName}`, profilePic);
        if (uploadError) throw uploadError;

        const { data: publicUrlData, error: urlError } = supabase.storage
          .from("project-assets")
          .getPublicUrl(`user-${user.id}/projects/${fileName}`);
        if (urlError) throw urlError;

        profileUrl = publicUrlData.publicUrl;
      }

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert([
          {
            title: formData.title,
            details: formData.details, // HTML saved here
            tags: formData.tags,
            visibility: formData.visibility,
            location: formData.location,
            profile: profileUrl,
            ...galleryUploads,
            promote: null,
            approve: true,
            user_id: user.id, // make sure you track owner
          },
        ])
        .select()
        .single();
      if (projectError) throw projectError;

      setCreatedProject(projectData);
      showMessage("✅ Project created successfully!", "success");

      // Reset form
      setFormData({
        title: "",
        details: "",
        tags: "",
        visibility: "public",
        location: "",
      });
      setProfilePic(null);
      setProfilePreview(null);
      setGalleries(Array(6).fill({ file: null, description: "", preview: null }));
    } catch (err) {
      console.error("Upload error:", err);
      showMessage(err.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="hidden md:block pt-20" />
      <div className="md:hidden">
        <MobileHeader />
      </div>

      <div className="relative max-w-4xl mx-auto p-8 bg-white shadow-2xl rounded-2xl space-y-8">
        {message.text && (
          <div
            className={`fixed top-8 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-lg shadow-lg text-white z-50 transition-all duration-500 ${
              message.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {message.text}
            {message.type === "success" && createdProject && (
              <div className="mt-3 text-center">
                <Link
                  href="/dashboard/applicant/portfolio"
                  className="inline-block bg-black hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Go to Portfolio
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Banner */}
          <div>
            <label className="block font-semibold text-lg mb-2">Project Banner</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleProfileChange(e.target.files[0])}
              className="w-full border p-3 rounded-xl"
              required
            />
            {profilePreview && (
              <div className="mt-3 w-full h-48 relative rounded-xl overflow-hidden shadow-md">
                <Image src={profilePreview} alt="Profile Banner" fill className="object-cover" />
              </div>
            )}
          </div>

          {/* Project Title */}
          <div>
            <label className="block font-semibold text-lg mb-2">Project Title</label>
            <input
              type="text"
              placeholder="Enter project title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border p-3 rounded-xl"
              required
            />
          </div>

          {/* Project Details - REPLACED TEXTAREA with ReactQuill */}
          <div>
            <label className="block font-semibold text-lg mb-2">Project Details</label>
            <ReactQuill
              theme="snow"
              value={formData.details}
              onChange={(value) => setFormData({ ...formData, details: value })}
              modules={quillModules}
              formats={quillFormats}
              className="bg-white border rounded-xl"
            />
            <p className="text-sm text-gray-500 mt-2">
              Tip: Use the editor toolbar to add headings, lists, links, and images.
            </p>
          </div>

          {/* Gallery */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Gallery Images (Optional)</h3>
            <p className="text-sm text-gray-500 mb-3">Gallery images optional. Add 1 or more to enhance your portfolio.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {galleries.map((gallery, idx) => (
                <div key={idx} className="flex items-center space-x-4 border p-3 rounded-xl bg-gray-50">
                  <div className="w-24 h-24 relative rounded-lg overflow-hidden bg-gray-200">
                    {gallery.preview ? (
                      <Image src={gallery.preview} alt={`Gallery ${idx + 1}`} fill className="object-cover" />
                    ) : (
                      <span className="text-gray-400 text-sm flex items-center justify-center h-full w-full">Thumbnail</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleGalleryChange(idx, "file", e.target.files[0])}
                      className="w-full border p-2 rounded"
                    />
                    <textarea
  placeholder="Write your description"
  value={gallery.description}
  onChange={(e) => handleGalleryChange(idx, "description", e.target.value)}
  className="w-full border p-2 rounded h-32"
/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold text-lg mb-2">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Design, Architecture, Photography"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full border p-3 rounded-xl"
              required
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block font-semibold text-lg mb-2">Visibility</label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              className="w-full border p-3 rounded-xl"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block font-semibold text-lg mb-2">Location</label>
            <input
              type="text"
              placeholder="Country, State, City"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full border p-3 rounded-xl"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-2xl text-lg font-semibold hover:bg-orange-600 transition"
          >
            {loading ? "Creating Project..." : "Create Project"}
          </button>
        </form>
      </div>

      <div className="hidden md:block">
        <Footer />
      </div>
    </>
  );
}
