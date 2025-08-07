'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, X, Trash } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';

async function ensureUserRow(userId) {
  const { error } = await supabase
    .from('users')
    .upsert(
      { id: userId }, // you can add default role logic here if needed
      { onConflict: 'id' }
    );
  if (error) throw error;
}

export default function PortfolioModal({
  open,
  setOpen,
  portfolio = null, // edit mode if provided
  onSuccess = () => {},
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: '',
    live_link: '',
    repo_link: '',
    video_url: '',
    external_links: '',
  });

  const [coverImage, setCoverImage] = useState(null);
  const [existingCoverImageUrl, setExistingCoverImageUrl] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (portfolio) {
      setForm({
        title: portfolio.title || '',
        description: portfolio.description || '',
        tags: (portfolio.tags || []).join(', '),
        live_link: portfolio.live_link || '',
        repo_link: portfolio.repo_link || '',
        video_url: portfolio.video_url || '',
        external_links: (portfolio.external_links || []).join(', '),
      });
      setExistingCoverImageUrl(portfolio.cover_image || '');
      setExistingMediaUrls(portfolio.media_urls || []);
      setErrorMsg('');
      setSuccessMsg('');
    } else {
      resetForm();
    }
  }, [portfolio, open]);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      tags: '',
      live_link: '',
      repo_link: '',
      video_url: '',
      external_links: '',
    });
    setCoverImage(null);
    setExistingCoverImageUrl('');
    setMediaFiles([]);
    setExistingMediaUrls([]);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onDropMedia = useCallback(
    (acceptedFiles) => {
      const totalCount = existingMediaUrls.length + mediaFiles.length + acceptedFiles.length;
      if (totalCount > 6) {
        setErrorMsg('You can only have up to 6 media files in total.');
        return;
      }
      setMediaFiles((prev) => [...prev, ...acceptedFiles]);
    },
    [mediaFiles, existingMediaUrls]
  );

  const onDropCover = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) setCoverImage(acceptedFiles[0]);
  }, []);

  const {
    getRootProps: getMediaRootProps,
    getInputProps: getMediaInputProps,
  } = useDropzone({
    onDrop: onDropMedia,
    accept: { 'image/*': [] },
    multiple: true,
  });

  const {
    getRootProps: getCoverRootProps,
    getInputProps: getCoverInputProps,
  } = useDropzone({
    onDrop: onDropCover,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const uploadFileToStorage = async (file, path) => {
  const filePath = `${path}/${uuidv4()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('portfolio-assets')
    .upload(filePath, file);

  if (error) throw error;

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio-assets/${data.path}`;
};


  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setUploading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Ensure users table row exists so FK & RLS pass
      await ensureUserRow(user.id);

      // Upload cover if replaced
      let uploadedCoverUrl = existingCoverImageUrl || '';
      if (coverImage) {
        uploadedCoverUrl = await uploadFileToStorage(
          coverImage,
          `portfolios/${user.id}/cover`
        );
        console.log('Cover Image Uploaded URL:', uploadedCoverUrl);
      }

      // Media: keep existing + new
      const finalMediaUrls = [...existingMediaUrls];
      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const url = await uploadFileToStorage(
            file,
            `portfolios/${user.id}/media`
          );
          finalMediaUrls.push(url);
          console.log('Uploaded media file URL:', url);
        }
      }

      // Build payload
      const payload = {
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        tags: form.tags
          ? form.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        media_urls: finalMediaUrls,
        live_link: form.live_link.trim() || null,
        repo_link: form.repo_link.trim() || null,
        video_url: form.video_url.trim() || null,
        external_links: form.external_links
          ? form.external_links
              .split(',')
              .map((l) => l.trim())
              .filter(Boolean)
          : [],
        cover_image: uploadedCoverUrl || null,
        is_public: true,
      };

      if (portfolio && portfolio.id) {
        // Update existing
        const { error: updateError } = await supabase
          .from('portfolios')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', portfolio.id);

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }

        setSuccessMsg('Portfolio updated successfully!');
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('portfolios')
          .insert([payload]);

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }

        setSuccessMsg('Portfolio created successfully!');
      }

      onSuccess();
      if (!portfolio) resetForm();
    } catch (err) {
      console.error('Portfolio submit error:', err);
      setErrorMsg(err.message || 'Failed to save portfolio.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!portfolio?.id) return;
    if (!confirm('Are you sure you want to delete this portfolio?')) return;

    setUploading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', portfolio.id);
      if (error) throw error;
      setSuccessMsg('Portfolio deleted.');
      onSuccess();
      setOpen(false);
    } catch (err) {
      console.error('Delete error:', err);
      setErrorMsg(err.message || 'Failed to delete portfolio.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start">
            <Dialog.Title className="text-xl font-semibold text-gray-800 mb-2">
              {portfolio ? 'Edit Portfolio' : 'Create New Portfolio'}
            </Dialog.Title>
            {portfolio && (
              <button
                onClick={handleDelete}
                disabled={uploading}
                className="text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <Trash size={16} /> Delete
              </button>
            )}
          </div>

          {errorMsg && <p className="text-red-600 mb-2">{errorMsg}</p>}
          {successMsg && <p className="text-green-600 mb-2">{successMsg}</p>}

          <div className="space-y-4">
            <input
              name="title"
              placeholder="Project Title"
              value={form.title}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md"
            />

            <textarea
              name="description"
              placeholder="Project Description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border px-4 py-2 rounded-md"
            />

            <input
              name="tags"
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md"
            />

            <div>
              <label className="font-medium text-gray-700 mb-1 block">Cover Image</label>
              <div
                {...getCoverRootProps()}
                className="border-dashed border-2 border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-orange-500 transition"
              >
                <input {...getCoverInputProps()} />
                {coverImage ? (
                  <img
                    src={URL.createObjectURL(coverImage)}
                    alt="Cover Preview"
                    className="w-full h-48 object-cover rounded-md"
                  />
                ) : existingCoverImageUrl ? (
                  <img
                    src={existingCoverImageUrl}
                    alt="Existing Cover"
                    className="w-full h-48 object-cover rounded-md"
                  />
                ) : (
                  <p className="text-gray-500">Click or drag an image to upload</p>
                )}
              </div>
            </div>

            <div>
              <label className="font-medium text-gray-700 mb-1 block">Upload up to 6 Images</label>
              <div
                {...getMediaRootProps()}
                className="border-dashed border-2 border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-orange-500 transition"
              >
                <input {...getMediaInputProps()} />
                <p className="text-gray-500">Click or drag to add project images</p>
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {existingMediaUrls.map((url, idx) => (
                  <div key={`existing-${idx}`} className="relative w-24 h-24 rounded-md overflow-hidden">
                    <img src={url} alt="Existing media" className="w-full h-full object-cover" />
                    <button
                      className="absolute top-1 right-1 bg-black bg-opacity-50 p-1 rounded-full text-white"
                      onClick={() =>
                        setExistingMediaUrls((prev) => prev.filter((_, i) => i !== idx))
                      }
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {mediaFiles.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative w-24 h-24 rounded-md overflow-hidden">
                    <img src={URL.createObjectURL(file)} alt="Media Preview" className="w-full h-full object-cover" />
                    <button
                      className="absolute top-1 right-1 bg-black bg-opacity-50 p-1 rounded-full text-white"
                      onClick={() =>
                        setMediaFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <input
              name="video_url"
              placeholder="Video URL (YouTube, Vimeo, etc)"
              value={form.video_url}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md"
            />

            <input
              name="external_links"
              placeholder="Other External Links (comma separated)"
              value={form.external_links}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button
              onClick={() => {
                setOpen(false);
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full transition"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="bg-black hover:bg-orange-600 text-white px-6 py-2 rounded-full transition flex items-center gap-2"
            >
              {uploading ? <Loader2 className="animate-spin" size={20} /> : portfolio ? 'Save Changes' : 'Create Portfolio'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
