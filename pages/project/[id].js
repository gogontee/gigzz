'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import { MessageCircle, Pencil, Megaphone, Eye } from 'lucide-react';

export default function ProjectPage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [promotionOpen, setPromotionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [editData, setEditData] = useState({
    title: '',
    details: '',
    profile: '',
    profilePreview: '',
    profileFile: null,
    gallery: [],
  });

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

  const handlePromote = async (type) => {
    const { error } = await supabase.from('projects').update({ promote: type }).eq('id', project.id);
    if (error) console.error('Promotion failed:', error);
    else {
      setProject({ ...project, promote: type });
      setPromotionOpen(false);
    }
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

        {/* Floating chat button */}
        <button className="fixed md:absolute md:top-auto md:bottom-4 md:right-4 right-4 top-1/2 transform -translate-y-1/2 bg-black text-white p-2 md:p-3 rounded-full shadow-lg hover:bg-orange-400 transition z-20 breathe">
          <MessageCircle className="w-3 h-3 md:w-6 md:h-6" />
        </button>

        {/* User avatar */}
        {project.avatar_url && (
          <div className="absolute left-1/2 -bottom-14 transform -translate-x-1/2 flex flex-col items-center">
            <img
              src={project.avatar_url}
              alt="User Avatar"
              className="w-20 h-20 rounded-full border-4 border-white object-cover"
            />
            {fullName && <p className="mt-2 font-medium text-gray-800">{fullName}</p>}
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
              <Megaphone className="w-5 h-5 text-orange-500" />
            </button>
          </div>
        )}
      </div>

      {/* Title & Details */}
      <div className="mt-20 text-center">
        {isEditing ? (
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))}
            className="text-3xl font-bold border-b p-2 w-full text-center"
          />
        ) : (
          <h1 className="text-3xl font-bold">{project.title}</h1>
        )}

        {isEditing ? (
          <textarea
            value={editData.details}
            onChange={(e) => setEditData((p) => ({ ...p, details: e.target.value }))}
            className="mt-4 w-full border p-2 rounded"
          />
        ) : (
          project.details && <p className="mt-4 text-gray-700">{project.details}</p>
        )}

        {project.location && <p className="mt-2 text-gray-500 text-sm">📍 {project.location}</p>}
      </div>

      {/* Gallery */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Gallery</h2>
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
                    <input
                      type="text"
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
                      placeholder="Description"
                      className="border p-2 rounded mt-2"
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
                    {item.desc && <p className="mt-2 text-gray-600 text-sm">{item.desc}</p>}
                  </>
                )}
              </div>
            ))}
        </div>
      </div>

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

      {/* Success */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {successMsg}
        </div>
      )}

      {/* External links */}
      {externalLinks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">External Links</h2>
          <ul className="flex flex-wrap gap-3">
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
            <h2 className="text-lg font-semibold mb-4">Promote Your portfolio</h2>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => handlePromote('Premium')}
                  className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600"
                >
                  Premium – 10 Tokens
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePromote('Top Add')}
                  className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600"
                >
                  Top Add – 5 Tokens
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePromote('Featured Add')}
                  className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600"
                >
                  Featured Add – 3 Tokens
                </button>
              </li>
            </ul>
            <button
              onClick={() => setPromotionOpen(false)}
              className="mt-4 w-full bg-gray-300 p-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
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
