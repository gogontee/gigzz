'use client';
import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, X, Calendar, MapPin, DollarSign, Users, Briefcase, GraduationCap, ListChecks, Mail, Save } from 'lucide-react';
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
  const [showPriceFields, setShowPriceFields] = useState(false);

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
        salary_range_visibility: data.salary_range_visibility || false,
        cover_letter_visibility: data.cover_letter_visibility || false,
      });

      // Show price fields if there are existing values
      setShowPriceFields(!!(data.min_price || data.max_price || data.price_frequency));

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
    setShowPriceFields(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Determine salary_range_visibility based on whether price fields have values
      const hasPriceValues = !!(formData.min_price || formData.max_price || formData.price_frequency);
      
      const updatedData = {
        title: formData.title,
        category: formData.category,
        type: formData.type,
        description: formData.description || null,
        min_price: formData.min_price !== '' ? Number(formData.min_price) : null,
        max_price: formData.max_price !== '' ? Number(formData.max_price) : null,
        price_frequency: formData.price_frequency || null,
        application_deadline: formData.application_deadline || null,
        responsibilities: formData.responsibilities || null,
        requirements: formData.requirements || null,
        educational_qualification: formData.educational_qualification || null,
        location: formData.location || null,
        tags: formData.tags || null,
        salary_range_visibility: hasPriceValues, // Auto-set based on price field presence
        cover_letter_visibility: formData.cover_letter_visibility || false,
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if deadline is passed
  const isDeadlinePassed = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  // Format salary display based on visibility
  const getSalaryDisplay = () => {
    if (job?.salary_range_visibility === false) {
      return 'Negotiable';
    }
    
    if (job?.min_price && job?.max_price) {
      return `₦${job.min_price.toLocaleString()} - ₦${job.max_price.toLocaleString()}`;
    } else if (job?.min_price) {
      return `₦${job.min_price.toLocaleString()}`;
    } else if (job?.max_price) {
      return `₦${job.max_price.toLocaleString()}`;
    } else {
      return 'N/A';
    }
  };

  // Get salary frequency display
  const getSalaryFrequency = () => {
    if (job?.salary_range_visibility === false) return null;
    return job?.price_frequency || 'one-time';
  };

  return (
    <div className="rounded-xl bg-white shadow-md border p-4 flex flex-col gap-2 hover:shadow-lg transition h-full">
      {isEditing ? (
        <div className="flex flex-col gap-3">
          {/* Editable Job Form Header */}
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <Pencil size={18} className="text-orange-500" />
              Edit Job
            </h3>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition">
              <X size={18} />
            </button>
          </div>

          {/* Job Title - Required */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="e.g., Senior Developer" 
              required
              className="border border-gray-300 rounded-lg p-2.5 text-sm w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>

          {/* Category & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Category</label>
              <input 
                name="category" 
                value={formData.category} 
                onChange={handleChange} 
                placeholder="e.g., Tech, Design" 
                className="border border-gray-300 rounded-lg p-2.5 text-sm w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Type</label>
              <input 
                name="type" 
                value={formData.type} 
                onChange={handleChange} 
                placeholder="e.g., Full-time, Freelance" 
                className="border border-gray-300 rounded-lg p-2.5 text-sm w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Location</label>
            <input 
              name="location" 
              value={formData.location} 
              onChange={handleChange} 
              placeholder="e.g., Lagos, Remote" 
              className="border border-gray-300 rounded-lg p-2.5 text-sm w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Describe the role..." 
              rows={3}
              className="border border-gray-300 rounded-lg p-2.5 text-sm w-full resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>

          {/* Salary Range Toggle */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showPriceFields}
                onChange={(e) => setShowPriceFields(e.target.checked)}
                className="w-4 h-4 text-orange-500 focus:ring-2 focus:ring-orange-500 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-800">Add salary range for this job?</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  If enabled, applicants will see the salary range.
                </p>
              </div>
            </label>
          </div>

          {/* Conditional Price Fields */}
          {showPriceFields && (
            <div className="border border-gray-200 rounded-lg p-3 bg-white space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Min Price (₦)</label>
                  <input
                    type="number"
                    name="min_price"
                    value={formData.min_price}
                    onChange={handleChange}
                    placeholder="50000"
                    className="border border-gray-300 rounded-lg p-2.5 text-sm w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Max Price (₦)</label>
                  <input
                    type="number"
                    name="max_price"
                    value={formData.max_price}
                    onChange={handleChange}
                    placeholder="150000"
                    className="border border-gray-300 rounded-lg p-2.5 text-sm w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Price Frequency</label>
                <select
                  name="price_frequency"
                  value={formData.price_frequency}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                >
                  <option value="">Select frequency</option>
                  <option value="Per Job">Per Job</option>
                  <option value="One-Time">One-Time</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>
          )}

          {/* Cover Letter Requirement */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="cover_letter_visibility"
                checked={formData.cover_letter_visibility || false}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-orange-500 focus:ring-2 focus:ring-orange-500 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-800">Require cover letter from applicants?</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  If enabled, applicants must submit a cover letter when applying.
                </p>
              </div>
            </label>
          </div>

          {/* Application Deadline - Optional */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Application Deadline <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input 
              name="application_deadline" 
              type="date" 
              value={formData.application_deadline} 
              onChange={handleChange} 
              className="border border-gray-300 rounded-lg p-2.5 text-sm w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>

          {/* Responsibilities */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Responsibilities</label>
            <textarea 
              name="responsibilities" 
              value={formData.responsibilities} 
              onChange={handleChange} 
              placeholder="List key responsibilities..." 
              rows={2}
              className="border border-gray-300 rounded-lg p-2.5 text-sm w-full resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Requirements</label>
            <textarea 
              name="requirements" 
              value={formData.requirements} 
              onChange={handleChange} 
              placeholder="List requirements..." 
              rows={2}
              className="border border-gray-300 rounded-lg p-2.5 text-sm w-full resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>

          {/* Educational Qualification */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Educational Qualification</label>
            <textarea 
              name="educational_qualification" 
              value={formData.educational_qualification} 
              onChange={handleChange} 
              placeholder="e.g., B.Sc. in Computer Science" 
              rows={2}
              className="border border-gray-300 rounded-lg p-2.5 text-sm w-full resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Tags (comma-separated)</label>
            <input 
              name="tags" 
              value={formData.tags} 
              onChange={handleChange} 
              placeholder="e.g., react, frontend, javascript" 
              className="border border-gray-300 rounded-lg p-2.5 text-sm w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>

          {/* Save Button */}
          <div className="flex gap-3 mt-4">
            <button 
              onClick={handleSave} 
              disabled={loading || !formData.title} 
              className="flex-1 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-orange-500 transition font-medium text-sm flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
            <button 
              onClick={handleCancel} 
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
            >
              Cancel
            </button>
          </div>
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
          
          {/* Salary Display */}
          <div className="text-sm text-gray-500">
            {getSalaryDisplay()}
            {job?.salary_range_visibility !== false && getSalaryFrequency() && (
              <> ({getSalaryFrequency()})</>
            )}
          </div>

          {/* Cover Letter Requirement Indicator */}
          {job?.cover_letter_visibility && (
            <div className="text-xs text-blue-600 flex items-center gap-1">
              <Mail size={12} />
              <span>Cover letter required</span>
            </div>
          )}

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

      {/* ✅ Enhanced Job Details Modal */}
      {isDetailsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 sm:p-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">{job.title}</h2>
                  <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-1 bg-white/20 px-2 sm:px-3 py-1 rounded-full">
                      <Briefcase size={14} />
                      <span>{job.category || 'Uncategorized'}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/20 px-2 sm:px-3 py-1 rounded-full">
                      <MapPin size={14} />
                      <span>{job.location || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/20 px-2 sm:px-3 py-1 rounded-full">
                      <Users size={14} />
                      <span>{applicantsCount} Applicants</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDetailsOpen(false)} 
                  className="text-white hover:bg-white/20 p-1 sm:p-2 rounded-full transition flex-shrink-0"
                >
                  <X size={18} className="sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Job Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Salary */}
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="text-green-600" size={18} />
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Salary</h3>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-gray-900">
                    {getSalaryDisplay()}
                  </p>
                  {job?.salary_range_visibility !== false && job?.price_frequency && (
                    <p className="text-xs sm:text-sm text-gray-600 capitalize">{job.price_frequency}</p>
                  )}
                  {job?.salary_range_visibility === false && (
                    <p className="text-xs sm:text-sm text-gray-600">Salary not disclosed</p>
                  )}
                </div>

                {/* Deadline */}
                {job.application_deadline && (
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className={isDeadlinePassed(job.application_deadline) ? "text-red-600" : "text-blue-600"} size={18} />
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Application Deadline</h3>
                    </div>
                    <p className={`text-base sm:text-lg font-bold ${isDeadlinePassed(job.application_deadline) ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(job.application_deadline)}
                    </p>
                    {isDeadlinePassed(job.application_deadline) && (
                      <p className="text-xs sm:text-sm text-red-600 font-medium">Deadline Passed</p>
                    )}
                  </div>
                )}
              </div>

              {/* Cover Letter Requirement */}
              {job?.cover_letter_visibility && (
                <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-blue-600" />
                    <span className="text-sm sm:text-base text-blue-800 font-medium">
                      Cover letter is required for this position
                    </span>
                  </div>
                </div>
              )}

              {/* Job Description */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Job Description</h3>
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                    {job.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Requirements & Qualifications */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Requirements */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                    <ListChecks size={18} className="text-orange-500" />
                    Requirements
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                    {job.requirements ? (
                      <ul className="space-y-1 sm:space-y-2">
                        {job.requirements.split('\n').filter(item => item.trim()).map((requirement, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-700 text-sm sm:text-base">
                            <span className="text-orange-500 mt-1 flex-shrink-0">•</span>
                            <span>{requirement.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic text-sm sm:text-base">No specific requirements listed.</p>
                    )}
                  </div>
                </div>

                {/* Qualifications */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                    <GraduationCap size={18} className="text-orange-500" />
                    Educational Qualification
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                    {job.educational_qualification ? (
                      <ul className="space-y-1 sm:space-y-2">
                        {job.educational_qualification.split('\n').filter(item => item.trim()).map((qualification, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-700 text-sm sm:text-base">
                            <span className="text-orange-500 mt-1 flex-shrink-0">•</span>
                            <span>{qualification.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic text-sm sm:text-base">No specific qualifications listed.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Responsibilities */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Responsibilities</h3>
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  {job.responsibilities ? (
                    <ul className="space-y-1 sm:space-y-2">
                      {job.responsibilities.split('\n').filter(item => item.trim()).map((responsibility, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700 text-sm sm:text-base">
                          <span className="text-orange-500 mt-1 flex-shrink-0">•</span>
                          <span>{responsibility.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-sm sm:text-base">No specific responsibilities listed.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Job ID: {job.id} • Posted on {formatDate(job.created_at)}
                </div>
                <div className="flex flex-col xs:flex-row gap-2 justify-center">
                  <Link href={`/job/${job.id}/applicants`} className="flex-1">
                    <button className="w-full bg-black text-white px-3 py-2 text-sm rounded-lg hover:bg-orange-500 transition font-medium">
                      View Applicants ({applicantsCount})
                    </button>
                  </Link>
                  <button 
                    onClick={() => setIsDetailsOpen(false)}
                    className="w-full border border-gray-300 text-gray-700 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
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