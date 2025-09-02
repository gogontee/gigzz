'use client';
import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import ProfileCard from '../ProfileCard'; // expects prop: id

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function JobListCard({ job, onDelete, onUpdate }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApplicantsOpen, setIsApplicantsOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false); // used for applicants modal loading
  const [applicantsCount, setApplicantsCount] = useState(0);
  const [applicants, setApplicants] = useState([]); // array of { id, applicant_id }

  // ✅ Fetch applicants COUNT (accurate + fast)
  useEffect(() => {
    const fetchApplicantsCount = async () => {
      if (!job?.id) return;

      const { count, error } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', job.id);

      if (error) {
        console.error('Error fetching applicants count:', error);
        return;
      }

      setApplicantsCount(count || 0);
    };

    fetchApplicantsCount();
  }, [job?.id]);

  // ✅ Fetch applicants LIST (IDs only; ProfileCard self-fetches full data by id)
  const fetchApplicants = async () => {
    if (!job?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('applications')
      .select('id, applicant_id')
      .eq('job_id', job.id)
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching applicants:', error.message);
      setApplicants([]);
    } else {
      setApplicants(data || []);
    }

    setIsApplicantsOpen(true);
    setLoading(false);
  };

  // ✅ Fetch latest job before editing
  const handleEditClick = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', job.id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title || '',
        category: data.category || '',
        type: data.type || '',
        description: data.description || '',
        min_price: data.min_price ?? '',
        max_price: data.max_price ?? '',
        price_frequency: data.price_frequency || '',
        application_deadline: data.application_deadline || '',
        responsibilities: data.responsibilities || '',
        requirements: data.requirements || '',
        location: data.location || '',
        tags: data.tags || '',
      });

      setIsEditing(true);
    } catch (err) {
      console.error('Failed to fetch job details:', err.message);
      alert('Could not fetch job details before editing.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const updatedData = {
        ...formData,
        min_price: formData.min_price !== '' ? Number(formData.min_price) : null,
        max_price: formData.max_price !== '' ? Number(formData.max_price) : null,
      };

      const { error } = await supabase
        .from('jobs')
        .update(updatedData)
        .eq('id', job.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate?.();
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
        {/* Editable Job Form */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-black">Edit Job</h3>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Inputs */}
        <input name="title" value={formData.title} onChange={handleChange} placeholder="Job Title" className="border rounded p-2 text-sm w-full" />
        <input name="category" value={formData.category} onChange={handleChange} placeholder="Category" className="border rounded p-2 text-sm w-full" />
        <input name="type" value={formData.type} onChange={handleChange} placeholder="Type" className="border rounded p-2 text-sm w-full" />
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="border rounded p-2 text-sm w-full resize-none" rows={3} />
        <input name="application_deadline" type="date" value={formData.application_deadline} onChange={handleChange} className="border rounded p-2 text-sm w-full" />
        <textarea name="responsibilities" value={formData.responsibilities} onChange={handleChange} placeholder="Responsibilities" className="border rounded p-2 text-sm w-full resize-none" rows={3} />
        <textarea name="requirements" value={formData.requirements} onChange={handleChange} placeholder="Requirements" className="border rounded p-2 text-sm w-full resize-none" rows={3} />
        <input name="location" value={formData.location} onChange={handleChange} placeholder="Location" className="border rounded p-2 text-sm w-full" />
        <div className="flex gap-2">
          <input name="min_price" value={formData.min_price} onChange={handleChange} placeholder="Min Price" type="number" className="border rounded p-2 text-sm w-1/2" />
          <input name="max_price" value={formData.max_price} onChange={handleChange} placeholder="Max Price" type="number" className="border rounded p-2 text-sm w-1/2" />
        </div>
        <input name="price_frequency" value={formData.price_frequency} onChange={handleChange} placeholder="Price Frequency (e.g., monthly)" className="border rounded p-2 text-sm w-full" />

        <button onClick={handleSave} disabled={loading} className="bg-black text-white px-4 py-2 rounded hover:bg-orange-500 transition mt-2">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    ) : (
      <>
        {/* Job Summary */}
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

        <div className="text-sm text-gray-700 line-clamp-2">{job?.description || 'No job description available.'}</div>
        <div className="text-sm text-gray-500">
          ₦{job?.min_price?.toLocaleString()} - ₦{job?.max_price?.toLocaleString()} ({job?.price_frequency || 'one-time'})
        </div>

        <div className="text-sm text-gray-600">Applicants: {applicantsCount}</div>

        <div className="flex justify-end gap-3 pt-2 mt-auto">
          <button onClick={() => setIsDetailsOpen(true)} className="text-sm text-green-600 hover:text-green-800">
            View Details
          </button>

          {/* ✅ Updated: Link to Applicants Page */}
          <Link href={`/job/${job.id}/applicants`}>
            <span className="text-sm text-purple-600 hover:text-purple-800 cursor-pointer">
              See Applicants
            </span>
          </Link>

          <button onClick={handleEditClick} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
            <Pencil size={16} /> Edit
          </button>
          <button onClick={onDelete} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </>
    )}

    {/* ✅ Job Details Modal */}
    {isDetailsOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white p-6 rounded-xl max-w-lg w-full relative">
          <button onClick={() => setIsDetailsOpen(false)} className="absolute top-2 right-2 text-gray-600 hover:text-black">
            <X size={18} />
          </button>
          <h2 className="text-xl font-bold mb-4">{job.title}</h2>
          <p className="text-gray-700 mb-2">{job.description}</p>
          <p><strong>Location:</strong> {job.location || 'N/A'}</p>
          <p><strong>Deadline:</strong> {job.application_deadline || 'N/A'}</p>
          <p><strong>Responsibilities:</strong> {job.responsibilities || 'N/A'}</p>
          <p><strong>Requirements:</strong> {job.requirements || 'N/A'}</p>
          <p><strong>Salary:</strong> ₦{job.min_price?.toLocaleString()} - ₦{job.max_price?.toLocaleString()} ({job.price_frequency || 'one-time'})</p>
          <p className="mt-2"><strong>Applicants:</strong> {applicantsCount}</p>
        </div>
      </div>
    )}
  </div>
);

}
