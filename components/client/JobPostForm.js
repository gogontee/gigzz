'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, Tag, ClipboardList, CheckCircle, X, Activity, FileText, ArrowRight, Sparkles, Briefcase } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import dayjs from 'dayjs';

const JOB_CATEGORIES = ['Remote', 'Hybrid', 'Onsite'];
const JOB_TYPES = ['Freelance', 'Contract', 'Full-time', 'Part-time'];
const PRICE_FREQUENCIES = ['Per Job', 'One-Time', 'Daily', 'Weekly', 'Monthly'];
const JOB_INDUSTRIES = [
  'Design & Creative',
  'Tech',
  'Marketing & Sales',
  'Writing & Translation',
  'Customer Support',
  'Finance & Accounting',
  'Fashion',
  'Entertainment',
  'Legal Services',
  'Construction',
  'Advertising',
  'Hospitality',
  'Transportation',
  'Others'
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
    tags: '',
    job_industry: JOB_INDUSTRIES[0], // ✅ new field for industry
    educational_qualification: '',
    is_agent: '', // ✅ new field - will be 'true' or 'false'
    agent_terms: '', // ✅ new field for agent terms and conditions
    confirmNoPayment: false,
    confirmJobAvailable: false
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [showAgentWarning, setShowAgentWarning] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // 🔑 Load saved draft from localStorage when component mounts
  useEffect(() => {
    const saved = localStorage.getItem('jobPostDraft');
    if (saved) {
      try {
        setForm(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing draft:', e);
      }
    }
  }, []);

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setForm((f) => ({ ...f, [name]: checked }));
  };

  // 🔑 Save draft to localStorage whenever form changes
  useEffect(() => {
    localStorage.setItem('jobPostDraft', JSON.stringify(form));
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // ✅ Handle agent selection with validation
  const handleAgentChange = (e) => {
    const value = e.target.value;
    
    // Show warning if user selects "yes" for agent and category is "Remote"
    if (value === 'true' && form.category === 'Remote') {
      setShowAgentWarning(true);
      return; // Don't update the form yet
    }
    
    setForm((f) => ({ 
      ...f, 
      is_agent: value,
      // Clear agent terms when switching from agent to non-agent
      ...(value === 'false' && { agent_terms: '' })
    }));
  };

  // ✅ Handle category change with agent validation
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    
    // Show warning if category is being changed to "Remote" and user is an agent
    if (value === 'Remote' && form.is_agent === 'true') {
      setShowAgentWarning(true);
      // Reset agent selection and terms when category changes to Remote
      setForm((f) => ({ ...f, category: value, is_agent: '', agent_terms: '' }));
      return;
    }
    
    setForm((f) => ({ ...f, category: value }));
  };

  const handleTagsChange = (e) => {
    setForm((f) => ({ ...f, tags: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validate agent selection
    if (!form.is_agent) {
      setStatus({ type: 'error', text: 'Please indicate if you are an agent or not.' });
      return;
    }

    // ✅ Validate agent terms if user is an agent
    if (form.is_agent === 'true' && !form.agent_terms.trim()) {
      setStatus({ type: 'error', text: 'Please provide your terms and conditions for applicants.' });
      return;
    }

    if (!employerId) {
      setStatus({ type: 'error', text: 'Missing employer context.' });
      return;
    }

    if (!form.title.trim() || !form.min_price || !form.max_price) {
      setStatus({ type: 'error', text: 'Job title and price range are required.' });
      return;
    }

    const minPrice = Number(form.min_price);
    const maxPrice = Number(form.max_price);
    if (isNaN(minPrice) || isNaN(maxPrice) || minPrice <= 0 || maxPrice <= 0) {
      setStatus({ type: 'error', text: 'Price range must be valid numbers.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', text: '' });

    try {
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
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
          : [],
        job_industry: form.job_industry, // ✅ Store selected industry
        avatar_url: employer.avatar_url,
        educational_qualification: form.educational_qualification || null,
        agent: form.is_agent === 'true', // ✅ Convert to boolean for database
        condition: form.is_agent === 'true' ? form.agent_terms.trim() : null, // ✅ Store agent terms in condition field
      };

      const { error } = await supabase.from('jobs').insert([insertObj]);

      if (error) {
        console.error('Insert job error:', error);
        setStatus({ type: 'error', text: error.message || 'Failed to post job.' });
      } else {
        setStatus({ type: 'success', text: 'Job posted successfully!' });
        setShowSuccessPopup(true);

        // 🔑 Clear form + clear saved draft
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
          tags: '',
          job_industry: JOB_INDUSTRIES[0], // ✅ Reset industry field
          educational_qualification: '',
          is_agent: '', // ✅ Reset agent field
          agent_terms: '', // ✅ Reset agent terms field
          confirmNoPayment: false,
          confirmJobAvailable: false
        });
        localStorage.removeItem('jobPostDraft');
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
      {/* Agent Warning Modal */}
      {showAgentWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold">Important Notice</h3>
            </div>
            <p className="text-gray-600 mb-6">
              To maintain the quality and transparency of our platform, <strong>agents are not permitted to post remote jobs</strong> on Gigzz. This helps us ensure that all remote opportunities are direct freelancing positions.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAgentWarning(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup Modal - Centered */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-gray-200 shadow-2xl transform transition-all duration-300 scale-100">
            <div className="text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-green-500" />
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Job Posted Successfully!
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                Your job listing has been published and is now live on Gigzz. 
                Applicants can now view and apply for your position.
              </p>
              
              {/* Sidebar Instructions */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-blue-800">View Your Job</span>
                </div>
                <p className="text-sm text-blue-700">
                  Click on <strong>"My Jobs"</strong> in your sidebar to see your new post and manage all your job listings.
                </p>
              </div>
              
              {/* Action Button */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="w-full px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Briefcase className="w-4 h-4" />
                  Continue to My Jobs
                </button>
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Post Another Job
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  💡 <strong>Tip:</strong> You can edit, promote, or close your job anytime from the "My Jobs" section.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-2">
        <Activity className="w-6 h-6 text-orange-500" />
        <h2 className="text-2xl font-bold">Post a New Job</h2>
      </div>
      <p className="text-sm text-gray-600">
        Fill in the details below to publish a job. Please be honest in your responses to maintain platform transparency.
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleCategoryChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            >
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ✅ Are You an Agent? Field */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="text-sm font-medium mb-3 block">
            Are You an Agent? <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Please be honest with your response. This helps maintain transparency in our job listings and ensures applicants know if they're applying through an agent or for direct employment.
          </p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="is_agent"
                value="true"
                checked={form.is_agent === 'true'}
                onChange={handleAgentChange}
                className="w-4 h-4 text-orange-500 focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-sm">Yes, I am an agent</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="is_agent"
                value="false"
                checked={form.is_agent === 'false'}
                onChange={handleAgentChange}
                className="w-4 h-4 text-orange-500 focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-sm">No, this is direct employment</span>
            </label>
          </div>
          {form.is_agent === 'true' && (
            <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              You've indicated you're an agent. Please note that agent-posted jobs cannot be remote.
            </p>
          )}
        </div>

        {/* ✅ Agent Terms and Conditions Field (Conditional) */}
        {form.is_agent === 'true' && (
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-orange-500" />
              <label className="text-sm font-medium">
                Your Terms & Conditions <span className="text-red-500">*</span>
              </label>
            </div>
            <p className="text-xs text-orange-700 mb-3">
              Please provide your terms and conditions for applicants. You can format your text with line breaks, bullet points, etc.
            </p>
            <textarea
              name="agent_terms"
              value={form.agent_terms}
              onChange={handleChange}
              rows={6}
              placeholder={`You can format your text any way you want:

• Use bullet points like this
• Add line breaks for readability
• Include important details
• Specify fees or requirements
• Add contact information

Example:
Commission: 10% of first month salary
Screening process: 2-3 business days
Do not ask for upfront payment from applicants.`}
              required
              className="w-full border border-orange-300 rounded-lg px-4 py-2 bg-white text-sm placeholder-orange-300 resize-vertical font-mono focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
            <div className="flex items-start gap-2 mt-2">
              <Activity className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-600">
                <strong>Formatting tips:</strong> Press Enter for new lines, use • for bullet points, add spaces for readability. Your formatting will be preserved exactly as you type it.
              </p>
            </div>
          </div>
        )}

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            >
              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1">Min Price (₦)</label>
            <input
              type="number"
              name="min_price"
              value={form.min_price}
              onChange={handleChange}
              placeholder="50000"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1">Price Frequency</label>
          <select
            name="price_frequency"
            value={form.price_frequency}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Lagos, Nigeria"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
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
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Educational Qualification */}
        <div>
          <label className="text-sm font-medium mb-1">Educational Qualification</label>
          <input
            type="text"
            name="educational_qualification"
            value={form.educational_qualification}
            onChange={handleChange}
            placeholder="B.Sc. in Computer Science"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-medium mb-1">Tags (comma-separated)</label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleTagsChange}
            placeholder="marketing, writing, frontend, react, figma"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
          />
        </div>

        {/* ✅ Select Industry Field - Added after Tags */}
        <div>
          <label className="text-sm font-medium mb-1">Select Industry</label>
          <select
            name="job_industry"
            value={form.job_industry}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
          >
            {JOB_INDUSTRIES.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Choose the industry that best describes this job. This helps applicants find jobs in their preferred field.
          </p>
        </div>

        {/* ✅ Policy Confirmations */}
        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
            <input
              type="checkbox"
              name="confirmNoPayment"
              checked={form.confirmNoPayment}
              onChange={handleCheckboxChange}
              className="mt-1 focus:ring-2 focus:ring-orange-500"
            />
            <span>Kindly confirm you are not asking applicants to pay in whatever form before getting hired.</span>
          </label>

          <label className="flex items-start gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
            <input
              type="checkbox"
              name="confirmJobAvailable"
              checked={form.confirmJobAvailable}
              onChange={handleCheckboxChange}
              className="mt-1 focus:ring-2 focus:ring-orange-500"
            />
            <span>Kindly confirm this job is currently available and open for application.</span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={
              loading || 
              !form.confirmNoPayment || 
              !form.confirmJobAvailable || 
              !form.is_agent ||
              (form.is_agent === 'true' && !form.agent_terms.trim())
            }
            className={`px-8 py-3 rounded-full transition font-medium ${
              loading || 
              !form.confirmNoPayment || 
              !form.confirmJobAvailable || 
              !form.is_agent ||
              (form.is_agent === 'true' && !form.agent_terms.trim())
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-black text-white hover:bg-orange-600 hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Posting...
              </span>
            ) : (
              "Post Job"
            )}
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