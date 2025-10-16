'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { MessageCircle, Pencil, Megaphone, Eye } from 'lucide-react';
import { useUser } from '@supabase/auth-helpers-react';
import DOMPurify from 'dompurify';
import dynamic from "next/dynamic";
// Dynamically import Quill so it only runs client-side
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

export default function ProjectPage() {
  const router = useRouter();
  const user = useUser();
  const supabase = createPagesBrowserClient(); // ✅ correct client initialization
  const { id } = router.query;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [promotionOpen, setPromotionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [expandedGallery, setExpandedGallery] = useState({});
  const [promoting, setPromoting] = useState(false); // ✅ state for promotion
  

  const [editData, setEditData] = useState({
    title: '',
    details: '',
    profile: '',
    profilePreview: '',
    profileFile: null,
    gallery: [],
  });

  // ✅ Helper for read more
  const renderWithReadMore = (text, expanded, toggle) => {
    if (!text) return null;
    const words = text.split(' ');
    if (words.length <= 50) return text;

    return (
      <>
        {expanded ? text : words.slice(0, 50).join(' ') + '...'}
        <button
          onClick={toggle}
          className="ml-2 text-orange-600 text-sm hover:underline"
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      </>
    );
  };

  // fetch project
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchProject = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (projectError) {
          console.error('Error fetching project:', projectError);
          if (!cancelled) {
            setProject(null);
            setLoading(false);
          }
          return;
        }

        await supabase
          .from('projects')
          .update({ views: (projectData.views || 0) + 1 })
          .eq('id', id);

        projectData.views = (projectData.views || 0) + 1;

        let avatar_url = null;
        let name = '';
        if (projectData.user_id) {
          const { data: applicantData } = await supabase
            .from('applicants')
            .select('avatar_url, full_name')
            .eq('id', projectData.user_id)
            .single();
          avatar_url = applicantData?.avatar_url || null;
          name = applicantData?.full_name || '';
        }

        if (!cancelled) {
          setProject({ ...projectData, avatar_url });
          setFullName(name);
          if (user && user.id === projectData.user_id) setIsOwner(true);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setLoading(false);
      }
    };

    fetchProject();
    return () => { cancelled = true; };
  }, [id]);

  // gallery from DB
  const galleryFromDB = useMemo(() => {
    if (!project) return [];
    const arr = [];
    for (let i = 1; i <= 6; i++) {
      arr.push({
        index: i,
        image: project[`gallery_image_${i}`] || '',
        desc: project[`gallery_desc_${i}`] || '',
      });
    }
    return arr;
  }, [project]);

  const externalLinks = project?.external_links || [];

  // robust path extractor from public URL
  const getStoragePathFromUrl = (url) => {
    try {
      const pathname = new URL(url).pathname;
      // /storage/v1/object/public/project-assets/... → project-assets/...
      const parts = pathname.split('/storage/v1/object/public/');
      return parts[1] || null;
    } catch {
      return null;
    }
  };

  // upload helper with delete → new unique filename
  const uploadAndReplaceImage = async (oldUrl, file, userId, projectId, kind, index) => {
    try {
      // delete old if exists
      if (oldUrl) {
        const oldPath = getStoragePathFromUrl(oldUrl);
        if (oldPath) {
          await supabase.storage.from('project-assets').remove([oldPath]);
        }
      }

      // build new unique filename
      const timestamp = Date.now();
      let fileName;
      if (kind === 'profile') {
        fileName = `profile-${timestamp}-${file.name}`;
      } else {
        fileName = `gallery-${timestamp}-${file.name}`;
      }

      const path = `user-${userId}/projects/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(path, file, {
          cacheControl: '0',
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('project-assets').getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      console.error('Upload error:', e.message || e);
      throw e;
    }
  };

  // edit mode
  const handleEdit = () => {
    setEditData({
      title: project.title || '',
      details: project.details || '',
      profile: project.profile || '',
      profilePreview: '',
      profileFile: null,
      gallery: galleryFromDB.map((g) => ({
        ...g,
        preview: '',
        file: null,
      })),
    });
    setIsEditing(true);
  };

  // save updates
  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    setSuccessMsg('');

    try {
      const userId = project.user_id;
      if (!userId) throw new Error('Missing project.user_id');

      // profile replace
      let nextProfileUrl = editData.profile || '';
      if (editData.profileFile) {
        nextProfileUrl = await uploadAndReplaceImage(
          project.profile,
          editData.profileFile,
          userId,
          project.id,
          'profile'
        );
      }

      // gallery replace
      const newGallery = await Promise.all(
        editData.gallery.map(async (g) => {
          if (g.file) {
            const url = await uploadAndReplaceImage(
              g.image,
              g.file,
              userId,
              project.id,
              'gallery',
              g.index
            );
            return { ...g, image: url, preview: '', file: null };
          }
          return g;
        })
      );

      // db updates
      const updates = {
        title: editData.title,
        details: editData.details,
        profile: nextProfileUrl,
      };
      for (let i = 1; i <= 6; i++) {
        const g = newGallery.find((x) => x.index === i);
        updates[`gallery_image_${i}`] = g?.image || project[`gallery_image_${i}`] || '';
        updates[`gallery_desc_${i}`] = g?.desc || project[`gallery_desc_${i}`] || '';
      }

      const { error } = await supabase.from('projects').update(updates).eq('id', project.id);
      if (error) throw error;

      setProject((prev) => ({ ...prev, ...updates }));
      setEditData((prev) => ({
        ...prev,
        profile: nextProfileUrl,
        profilePreview: '',
        profileFile: null,
        gallery: newGallery,
      }));
      setIsEditing(false);
      setSuccessMsg('✅ Project updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      console.error('Save failed:', e.message || e);
      alert(e.message || 'Failed to update project.');
    } finally {
      setSaving(false);
    }
  };

  // ✅ Handle promotion: Deduct 5 tokens, log action, set promote to "Premium"
  // ✅ Simplified Promotion Flow
const handlePromote = async () => {
  if (!project) {
    alert('Project not loaded yet.');
    return;
  }

  setPromoting(true);
  try {
    // 1. Fetch wallet
    const { data: wallet, error: walletError } = await supabase
      .from('token_wallets')
      .select('id, balance')
      .eq('user_id', project.user_id) // 👈 link wallet to the project owner
      .single();

    if (walletError || !wallet) {
      console.error('Wallet fetch error:', walletError);
      alert('Wallet not found.');
      setPromoting(false);
      return;
    }

    if (wallet.balance < 5) {
      alert('Not enough tokens. You need 5 tokens to promote.');
      setPromoting(false);
      return;
    }

    // 2. Deduct tokens + set last_action
    const { error: walletUpdateError } = await supabase
      .from('token_wallets')
      .update({
        balance: wallet.balance - 5,
        last_action: 'Project promotion',
      })
      .eq('id', wallet.id);

    if (walletUpdateError) {
      console.error('Wallet update error:', walletUpdateError);
      alert('Failed to update wallet.');
      setPromoting(false);
      return;
    }

    // 3. Promote project with expiry (7 days)
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + 7);

    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({
        promote: 'Premium',
        promote_expires_at: expiresAt.toISOString(),
      })
      .eq('id', project.id);

    if (projectUpdateError) {
      console.error('Project update error:', projectUpdateError);
      alert('Failed to promote project.');
      setPromoting(false);
      return;
    }

    // 4. Success 🎉
    setProject((prev) => ({
      ...prev,
      promote: 'Premium',
      promote_expires_at: expiresAt.toISOString(),
    }));
    setSuccessMsg('🎉 Your portfolio has been promoted to Premium!');
    setTimeout(() => setSuccessMsg(''), 4000);
    setPromotionOpen(false);
  } catch (e) {
    console.error('Promotion error:', e.message);
    alert('Unexpected error promoting project.');
  } finally {
    setPromoting(false);
  }
};

  // Get promotion icon color based on project status
  const getPromotionIconColor = () => {
    return project?.promote ? 'text-green-500' : 'text-orange-500';
  };

  // render
  if (loading) return <p className="text-center py-10">Loading project...</p>;
  if (!project) return <p className="text-center py-10 text-red-600">Project not found.</p>;
  

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-0 pt-8 md:pt-20 relative">
      {/* Banner */}
      <div className="relative">
        {isEditing ? (
          <div className="relative">
            <img
              src={editData.profilePreview || editData.profile || '/placeholder-banner.jpg'}
              alt="Banner"
              className="w-full h-64 object-cover rounded-b-xl"
            />
            <input
              type="file"
              accept="image/*"
              className="absolute bottom-2 left-2 bg-white text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (editData.profilePreview) URL.revokeObjectURL(editData.profilePreview);
                  setEditData((prev) => ({
                    ...prev,
                    profilePreview: URL.createObjectURL(file),
                    profileFile: file,
                  }));
                }
              }}
            />
          </div>
        ) : (
          <img
            src={project.profile || '/placeholder-banner.jpg'}
            alt={project.title}
            className="w-full h-64 object-cover rounded-b-xl"
          />
        )}

        {/* User avatar */}
        {project.avatar_url && (
          <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 mt-4 flex flex-col items-center">
            <a href={`/dashboard/profile/${project.user_id}`}>
              <img
                src={project.avatar_url}
                alt="User Avatar"
                className="w-20 h-20 rounded-full border-4 border-white object-cover hover:scale-105 transition"
              />
            </a>
            {fullName && (
              <a
                href={`/dashboard/profile/${project.user_id}`}
                className="mt-2 font-medium text-gray-800 hover:text-orange-500 transition"
              >
                {fullName}
              </a>
            )}
          </div>
        )}

        {/* Owner actions */}
        {isOwner && (
          <div className="absolute top-4 right-4 flex gap-3">
            <button onClick={handleEdit} className="bg-white p-2 rounded-full shadow hover:bg-gray-100">
              <Pencil className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => setPromotionOpen(true)}
              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
            >
              <Megaphone className={`w-5 h-5 ${getPromotionIconColor()}`} />
            </button>
          </div>
        )}
      </div>

      {/* Title & Details - Centered */}
      <div className="mt-20 text-center mx-auto max-w-3xl px-4">
        {isEditing ? (
          <input
            type="text"
            value={editData.title}
            onChange={(e) =>
              setEditData((p) => ({ ...p, title: e.target.value }))
            }
            className="text-xl font-bold border-b p-2 w-full text-center"
          />
        ) : (
          <h1 className="text-xl font-bold">{project.title}</h1>
        )}

        {isEditing ? (
          // ✅ Use Quill editor for details instead of textarea
          <div className="mt-4">
            <ReactQuill
              theme="snow"
              value={editData.details}
              onChange={(val) =>
                setEditData((p) => ({ ...p, details: val }))
              }
              className="bg-white rounded"
            />
          </div>
        ) : (
          project.details && (
            <div className="mt-4 text-gray-700 prose text-center mx-auto">
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    expandedDesc
                      ? project.details
                      : project.details
                          ?.split(" ")
                          .slice(0, 50)
                          .join(" ") + "..."
                  ),
                }}
              />
              {project.details?.split(" ").length > 50 && (
                <button
                  onClick={() => setExpandedDesc((prev) => !prev)}
                  className="ml-2 text-orange-600 text-sm hover:underline"
                >
                  {expandedDesc ? "Read less" : "Read more"}
                </button>
              )}
            </div>
          )
        )}

        {project.location && (
          <p className="mt-2 text-gray-500 text-sm">📍 {project.location}</p>
        )}
      </div>

      {/* Gallery */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-center">Gallery</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(isEditing ? editData.gallery : galleryFromDB)
            .filter((item) => isEditing || item.image)
            .map((item) => (
              <div key={item.index} className="flex flex-col">
                {isEditing ? (
                  <>
                    <img
                      src={item.preview || item.image || '/placeholder.jpg'}
                      alt={`Preview ${item.index}`}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setEditData((prev) => {
                          const next = prev.gallery.map((g) => {
                            if (g.index !== item.index) return g;
                            if (g.preview) URL.revokeObjectURL(g.preview);
                            return { ...g, preview: URL.createObjectURL(file), file };
                          });
                          return { ...prev, gallery: next };
                        });
                      }}
                    />

                    {/* Multiline textarea for description */}
                    <textarea
                      placeholder="Write your description"
                      value={item.desc || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditData((prev) => {
                          const next = prev.gallery.map((g) =>
                            g.index === item.index ? { ...g, desc: val } : g
                          );
                          return { ...prev, gallery: next };
                        });
                      }}
                      className="w-full border p-2 rounded mt-2 h-32"
                    />
                  </>
                ) : (
                  <>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.desc || `Gallery image ${item.index}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                    {item.desc && (
                      <p className="mt-2 text-gray-600 text-sm whitespace-pre-line text-center">
                        {renderWithReadMore(
                          item.desc,
                          !!expandedGallery[item.index],
                          () =>
                            setExpandedGallery((prev) => ({
                              ...prev,
                              [item.index]: !prev[item.index],
                            }))
                        )}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Show See Profile button only if viewer is NOT the owner */}
      {user && user.id !== project.user_id && (
        <div className="mt-6 flex justify-center">
          <a
            href={`/dashboard/profile/${project.user_id}`}
            className="text-sm text-white bg-orange-500 px-4 py-2 rounded-full hover:bg-orange-600 transition"
          >
            See Profile
          </a>
        </div>
      )}

      {/* Save buttons */}
      {isEditing && (
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={handleSave}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            {saving ? 'Updating…' : 'Save'}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      )}

      {successMsg && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg text-lg font-semibold">
            {successMsg}
          </div>
        </div>
      )}

      {/* External links */}
      {externalLinks.length > 0 && (
        <div className="mt-8 text-center">
          <h2 className="text-xl font-semibold mb-2">External Links</h2>
          <ul className="flex flex-wrap gap-3 justify-center">
            {externalLinks.map((link, idx) => (
              <li key={idx}>
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Views */}
      <div className="mt-4 flex justify-center items-center gap-2 text-gray-600">
        <Eye className="w-5 h-5" />
        <span>{project.views || 0} views</span>
      </div>

      {/* Promotion modal */}
      {promotionOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            {project.promote?.toLowerCase() === 'premium' ? (
              <>
                <h2 className="text-lg font-semibold mb-4">Already Promoted</h2>
                <p className="text-gray-700 mb-4">Your portfolio is already promoted as Premium.</p>
                <button
                  onClick={() => setPromotionOpen(false)}
                  className="w-full bg-gray-300 p-2 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4">Promote Your Portfolio</h2>
                <p className="text-sm text-gray-600 mb-4">Promote your portfolio to Premium for 5 tokens.</p>
                <button
                  onClick={handlePromote}
                  disabled={promoting}
                  className={`w-full p-2 rounded ${
                    promoting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {promoting ? 'Processing...' : 'Promote to Premium – 5 Tokens'}
                </button>
                <button
                  onClick={() => setPromotionOpen(false)}
                  className="mt-4 w-full bg-gray-300 p-2 rounded hover:bg-gray-400"
                  disabled={promoting}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          70% { transform: scale(1.1); }
        }
        .breathe {
          animation: breathe 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}