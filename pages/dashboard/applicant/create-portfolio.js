// pages/dashboard/applicant/create-portfolio.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabaseClient';
import ApplicantLayout from '../../components/ApplicantLayout';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function CreatePortfolio() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: '',
    live_link: '',
    repo_link: '',
    is_public: true,
    cover_image: '',
    media_urls: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const user = supabase.auth.getUser();
    const user_id = (await user).data.user?.id;
    if (!user_id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    const { title, description, tags, live_link, repo_link, is_public, cover_image, media_urls } = form;

    const { error: insertError } = await supabase.from('portfolios').insert([
      {
        user_id,
        title,
        description,
        tags: tags.split(',').map((tag) => tag.trim()),
        live_link,
        repo_link,
        is_public,
        cover_image,
        media_urls: media_urls.split(',').map((url) => url.trim()),
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard/applicant/portfolio');
  };

  return (
    <ApplicantLayout>
      <motion.div
        className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-md mt-8"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Create Portfolio</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Project Title"
            className="w-full border p-3 rounded-md"
            value={form.title}
            onChange={handleChange}
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            className="w-full border p-3 rounded-md"
            value={form.description}
            onChange={handleChange}
            rows={5}
          />

          <input
            type="text"
            name="tags"
            placeholder="Tags (comma-separated)"
            className="w-full border p-3 rounded-md"
            value={form.tags}
            onChange={handleChange}
          />

          <input
            type="text"
            name="media_urls"
            placeholder="Media URLs (comma-separated)"
            className="w-full border p-3 rounded-md"
            value={form.media_urls}
            onChange={handleChange}
          />

          <input
            type="text"
            name="cover_image"
            placeholder="Cover Image URL"
            className="w-full border p-3 rounded-md"
            value={form.cover_image}
            onChange={handleChange}
          />

          <div className="flex gap-4">
            <input
              type="text"
              name="live_link"
              placeholder="Live Project Link"
              className="w-full border p-3 rounded-md"
              value={form.live_link}
              onChange={handleChange}
            />

            <input
              type="text"
              name="repo_link"
              placeholder="Repo Link"
              className="w-full border p-3 rounded-md"
              value={form.repo_link}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_public"
              checked={form.is_public}
              onChange={handleChange}
            />
            <label>Make Public</label>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-md hover:bg-orange-600 transition flex justify-center items-center"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Create Portfolio'}
          </button>
        </form>
      </motion.div>
    </ApplicantLayout>
  );
}
