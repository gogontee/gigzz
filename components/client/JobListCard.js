'use client';
import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import ProfileCard from '../ProfileCard'; // expects prop: id

export const supabase = createPagesBrowserClient();

export default function JobListCard({ job, onDelete, onUpdate }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false); 
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [applicantsCount, setApplicantsCount] = useState(0);

  // ✅ Fetch applicants COUNT
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
        educational_qualification: data.educational_qualification || '',
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

  // ✅ Delete job function
  const handleDeleteJob = async () => {
    try {
      setDeleteLoading(true);
      
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', job.id);

      if (error) throw error;

      // Close confirmation modal
      setIsDeleteConfirmOpen(false);
      
      // Call parent callback to update UI
      onDelete?.(job.id);
      
      alert('Job deleted successfully!');
    } catch (err) {
      console.error('Error deleting job:', err.message);
      alert('Failed to delete job: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ✅ Open delete confirmation
  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  // ✅ Close delete confirmation
  const handleCancelDelete = () => {
    setIsDeleteConfirmOpen(false);
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
          <textarea name="educational_qualification" value={formData.educational_qualification} onChange={handleChange} placeholder="Qualification" className="border rounded p-2 text-sm w-full resize-none" rows={3} />
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

          <div className="flex flex-wrap justify-end gap-3 pt-2 mt-auto">
            <button onClick={() => setIsDetailsOpen(true)} className="text-sm text-green-600 hover:text-green-800">
              Details
            </button>

            <Link href={`/job/${job.id}/applicants`}>
              <span className="text-sm text-purple-600 hover:text-purple-800 cursor-pointer">
                Applicants
              </span>
            </Link>

            <button onClick={handleEditClick} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
              <Pencil size={16} /> 
            </button>
            <button 
              onClick={handleDeleteClick}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
            >
              <Trash2 size={16} /> 
            </button>
          </div>
        </>
      )}

      {/* ✅ Job Details Modal */}
      {isDetailsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-40 overflow-y-auto">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full relative max-h-[85vh] overflow-y-auto mt-20">
            <button onClick={() => setIsDetailsOpen(false)} className="absolute top-2 right-2 text-gray-600 hover:text-black">
              <X size={18} />
            </button>
            <h2 className="text-xl font-bold mb-4 text-orange-400">{job.title}</h2>
            <p className="text-gray-700 mb-2">{job.description}</p>
            <p><strong>Location:</strong> {job.location || 'N/A'}</p>
            <p><strong>Deadline:</strong> {job.application_deadline || 'N/A'}</p>
            <p><strong>Responsibilities:</strong> {job.responsibilities || 'N/A'}</p>
            <p><strong>Requirements:</strong> {job.requirements || 'N/A'}</p>
            <p><strong>Qualification:</strong> {job.educational_qualification || 'N/A'}</p>
            <p><strong>Salary:</strong> ₦{job.min_price?.toLocaleString()} - ₦{job.max_price?.toLocaleString()} ({job.price_frequency || 'one-time'})</p>
            <p className="mt-2"><strong>Applicants:</strong> {applicantsCount}</p>
          </div>
        </div>
      )}

      {/* ✅ Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Job</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "<strong>{job.title}</strong>"? This action cannot be undone and all applications will be lost.
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteJob}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Job'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}