'use client';
import React, { useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function JobListCard({ job, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: job.title || '',
    category: job.category || '',
    type: job.type || '',
    description: job.description || '',
    min_price: job.min_price || '',
    max_price: job.max_price || '',
    price_frequency: job.price_frequency || '',
  });
  const [loading, setLoading] = useState(false);

  const handleEditClick = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      title: job.title || '',
      category: job.category || '',
      type: job.type || '',
      description: job.description || '',
      min_price: job.min_price || '',
      max_price: job.max_price || '',
      price_frequency: job.price_frequency || '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Convert prices to numbers
      const updatedData = {
        ...formData,
        min_price: formData.min_price ? Number(formData.min_price) : null,
        max_price: formData.max_price ? Number(formData.max_price) : null,
      };

      const { error } = await supabase
        .from('jobs')
        .update(updatedData)
        .eq('id', job.id);

      if (error) throw error;

      setIsEditing(false);

      if (onUpdate) onUpdate(); // refresh parent data
      alert('Job updated successfully!');
    } catch (err) {
      console.error('Error updating job:', err.message);
      alert('Failed to update job: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-md border p-4 flex flex-col gap-2 hover:shadow-lg transition h-full">
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-black">Edit Job</h3>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Job Title"
            className="border rounded p-2 text-sm w-full"
          />
          <input
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="Category"
            className="border rounded p-2 text-sm w-full"
          />
          <input
            name="type"
            value={formData.type}
            onChange={handleChange}
            placeholder="Type"
            className="border rounded p-2 text-sm w-full"
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description"
            className="border rounded p-2 text-sm w-full resize-none"
            rows={3}
          />
          <div className="flex gap-2">
            <input
              name="min_price"
              value={formData.min_price}
              onChange={handleChange}
              placeholder="Min Price"
              type="number"
              className="border rounded p-2 text-sm w-1/2"
            />
            <input
              name="max_price"
              value={formData.max_price}
              onChange={handleChange}
              placeholder="Max Price"
              type="number"
              className="border rounded p-2 text-sm w-1/2"
            />
          </div>
          <input
            name="price_frequency"
            value={formData.price_frequency}
            onChange={handleChange}
            placeholder="Price Frequency (e.g., monthly)"
            className="border rounded p-2 text-sm w-full"
          />

          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded hover:bg-orange-500 transition mt-2"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-black">{job?.title || 'Untitled Job'}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {job?.category || 'Uncategorized'} • {job?.type || 'Type N/A'}
              </p>
            </div>
            {job?.is_promoted && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                Promoted • {job.promoted_plan?.charAt(0).toUpperCase() + job.promoted_plan?.slice(1)}
              </span>
            )}
          </div>

          <div className="text-sm text-gray-700 line-clamp-2">
            {job?.description || 'No job description available.'}
          </div>

          <div className="text-sm text-gray-500">
            ₦{job?.min_price?.toLocaleString()} - ₦{job?.max_price?.toLocaleString()} ({job?.price_frequency || 'one-time'})
          </div>

          <div className="flex justify-end gap-3 pt-2 mt-auto">
            <button
              onClick={handleEditClick}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Pencil size={16} /> Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
