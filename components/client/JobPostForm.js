'use client';
import React, { useState } from 'react';
import { Calendar, Tag, ClipboardList, CheckCircle, X, Activity } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import dayjs from 'dayjs';

const JOB_CATEGORIES = ['Remote', 'Hybrid', 'Onsite'];
const JOB_TYPES = ['Freelance', 'Contract', 'Full-time', 'Part-time'];
const PRICE_FREQUENCIES = ['One-time', 'Daily', 'Weekly', 'Monthly'];
const PROMOTION_LEVELS = [
  { label: 'None', value: '' },
  { label: 'Featured', value: 'featured' },
  { label: 'Priority', value: 'priority' },
];

export default function JobPostForm({ employerId, onPosted }) {
  const [form, setForm] = useState({
    title: '',
    category: JOB_CATEGORIES[0],
    type: JOB_TYPES[0],
    min_price: '',
    max_price: '',
    price_frequency: PRICE_FREQUENCIES[0],
    application_deadline: '',
    description: '',
    responsibilities: '',
    requirements: '',
    location: '',
    promotion_tag: '',
    tags: '',
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleTagsChange = (e) => {
    setForm((f) => ({ ...f, tags: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employerId) {
      setStatus({ type: 'error', text: 'Missing employer context.' });
      return;
    }

    if (!form.title.trim() || !form.min_price || !form.max_price) {
      setStatus({ type: 'error', text: 'Job title and price range are required.' });
      return;
    }

    // ✅ Validate numeric prices
    const minPrice = Number(form.min_price);
    const maxPrice = Number(form.max_price);
    if (isNaN(minPrice) || isNaN(maxPrice) || minPrice <= 0 || maxPrice <= 0) {
      setStatus({ type: 'error', text: 'Price range must be valid numbers.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', text: '' });

    try {
      // ✅ Fetch employer avatar
      const { data: employer, error: empErr } = await supabase
        .from('employers')
        .select('avatar_url')
        .eq('id', employerId)
        .single();

      if (empErr) throw empErr;

      if (!employer?.avatar_url) {
        setStatus({ type: 'error', text: 'Please update your profile and add a profile picture before posting a job.' });
        alert('Please update your profile and add a profile picture before posting a job.');
        setLoading(false);
        return;
      }

      const insertObj = {
        employer_id: employerId,
        title: form.title.trim(),
        category: form.category,
        type: form.type,
        min_price: minPrice,
        max_price: maxPrice,
        price_frequency: form.price_frequency,
        application_deadline: form.application_deadline
          ? dayjs(form.application_deadline).format('YYYY-MM-DD')
          : null,
        description: form.description || null,
        responsibilities: form.responsibilities || null,
        requirements: form.requirements || null,
        location: form.location || null,
        promotion_tag: form.promotion_tag || null,
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
          : [],
        avatar_url: employer.avatar_url, // ✅ store employer avatar into jobs table
      };

      const { error } = await supabase.from('jobs').insert([insertObj]);

      if (error) {
        console.error('Insert job error:', error);
        setStatus({ type: 'error', text: error.message || 'Failed to post job.' });
      } else {
        setStatus({ type: 'success', text: 'Job posted successfully!' });
        setForm({
          title: '',
          category: JOB_CATEGORIES[0],
          type: JOB_TYPES[0],
          min_price: '',
          max_price: '',
          price_frequency: PRICE_FREQUENCIES[0],
          application_deadline: '',
          description: '',
          responsibilities: '',
          requirements: '',
          location: '',
          promotion_tag: '',
          tags: '',
        });
        onPosted?.();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', text: 'Unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Activity className="w-6 h-6 text-orange-500" />
        <h2 className="text-2xl font-bold">Post a New Job</h2>
      </div>
      <p className="text-sm text-gray-600">
        Fill in the details below to publish a job. You can promote it for more visibility.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1">Job Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Senior Developer"
              required
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-4 py-2"
            >
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-4 py-2"
            >
              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ Numeric Price Inputs */}
          <div>
            <label className="text-sm font-medium mb-1">Min Price (₦)</label>
            <input
              type="number"
              name="min_price"
              value={form.min_price}
              onChange={handleChange}
              placeholder="50000"
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1">Max Price (₦)</label>
            <input
              type="number"
              name="max_price"
              value={form.max_price}
              onChange={handleChange}
              placeholder="150000"
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1">Price Frequency</label>
          <select
            name="price_frequency"
            value={form.price_frequency}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-4 py-2"
          >
            {PRICE_FREQUENCIES.map((freq) => (
              <option key={freq} value={freq}>
                {freq}
              </option>
            ))}
          </select>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1">Application Deadline</label>
            <input
              type="date"
              name="application_deadline"
              value={form.application_deadline}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Lagos, Nigeria"
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="Describe the role..."
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        {/* Responsibilities & Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1">Responsibilities</label>
            <textarea
              name="responsibilities"
              value={form.responsibilities}
              onChange={handleChange}
              rows={3}
              placeholder="Duties and tasks..."
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1">Requirements</label>
            <textarea
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              rows={3}
              placeholder="Skills and experience..."
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
          </div>
        </div>

        {/* Tags & Promotion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              name="tags"
              value={form.tags}
              onChange={handleTagsChange}
              placeholder="frontend, react, figma"
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1">Promotion</label>
            <select
              name="promotion_tag"
              value={form.promotion_tag}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-4 py-2"
            >
              {PROMOTION_LEVELS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded-full hover:bg-orange-600"
          >
            {loading ? 'Posting...' : 'Post Job'}
          </button>
          {status.text && (
            <p className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {status.text}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
