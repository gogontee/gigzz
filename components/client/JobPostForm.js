'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, Tag, ClipboardList, CheckCircle, X, Activity, FileText, ArrowRight, Sparkles, Briefcase, DollarSign, Mail, Shield, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

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
  'Management',
  'Beauty & Fashion',
  'Entertainment',
  'Legal Services',
  'Construction',
  'Advertising',
  'Hospitality',
  'Transportation',
  'Others'
];

export default function JobPostForm({ employerId, onPosted }) {
  const router = useRouter();
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
    job_industry: JOB_INDUSTRIES[0],
    educational_qualification: '',
    is_agent: '',
    agent_terms: '',
    showPriceRange: false,
    requireCoverLetter: false,
    confirmNoPayment: false,
    confirmJobAvailable: false,
    acceptTerms: false
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [showAgentWarning, setShowAgentWarning] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Load saved draft from localStorage when component mounts
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

  // Save draft to localStorage whenever form changes
  useEffect(() => {
    localStorage.setItem('jobPostDraft', JSON.stringify(form));
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Handle agent selection with validation
  const handleAgentChange = (e) => {
    const value = e.target.value;
    
    if (value === 'true' && form.category === 'Remote') {
      setShowAgentWarning(true);
      return;
    }
    
    setForm((f) => ({ 
      ...f, 
      is_agent: value,
      ...(value === 'false' && { agent_terms: '' })
    }));
  };

  // Handle category change with agent validation
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    
    if (value === 'Remote' && form.is_agent === 'true') {
      setShowAgentWarning(true);
      setForm((f) => ({ ...f, category: value, is_agent: '', agent_terms: '' }));
      return;
    }
    
    setForm((f) => ({ ...f, category: value }));
  };

  const handleTagsChange = (e) => {
    setForm((f) => ({ ...f, tags: e.target.value }));
  };

  // Check user verification status
  const checkVerificationStatus = async (userId) => {
    setCheckingVerification(true);
    try {
      const { data: verification, error } = await supabase
        .from('verifications')
        .select('approved, created_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      setVerificationStatus(verification);
      return verification;
    } catch (err) {
      console.error('Error checking verification:', err);
      return null;
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.acceptTerms) {
      setStatus({ type: 'error', text: 'You must accept the Terms of Use to post a job.' });
      return;
    }

    if (!form.is_agent) {
      setStatus({ type: 'error', text: 'Please indicate if you are an agent or not.' });
      return;
    }

    if (form.is_agent === 'true' && !form.agent_terms.trim()) {
      setStatus({ type: 'error', text: 'Please provide your terms and conditions for applicants.' });
      return;
    }

    if (!employerId) {
      setStatus({ type: 'error', text: 'Missing employer context.' });
      return;
    }

    if (!form.title.trim()) {
      setStatus({ type: 'error', text: 'Job title is required.' });
      return;
    }

    if (form.showPriceRange) {
      if (!form.min_price || !form.max_price) {
        setStatus({ type: 'error', text: 'Price range is required when enabled.' });
        return;
      }

      const minPrice = Number(form.min_price);
      const maxPrice = Number(form.max_price);
      if (isNaN(minPrice) || isNaN(maxPrice) || minPrice <= 0 || maxPrice <= 0) {
        setStatus({ type: 'error', text: 'Price range must be valid numbers.' });
        return;
      }

      if (minPrice > maxPrice) {
        setStatus({ type: 'error', text: 'Minimum price cannot be greater than maximum price.' });
        return;
      }
    }

    setLoading(true);
    setStatus({ type: '', text: '' });

    try {
      const verification = await checkVerificationStatus(employerId);
      
      if (!verification) {
        setStatus({ 
          type: 'error', 
          text: 'Please verify your identity before posting jobs.' 
        });
        setVerificationStatus(null);
        setLoading(false);
        return;
      }

      if (verification.approved === 'pending') {
        setStatus({ 
          type: 'error', 
          text: 'Your verification is still pending. Please wait for approval before posting jobs.' 
        });
        setLoading(false);
        return;
      }

      if (verification.approved !== 'verified') {
        setStatus({ 
          type: 'error', 
          text: 'Unable to post job. Please contact support.' 
        });
        setLoading(false);
        return;
      }

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
        min_price: form.showPriceRange ? Number(form.min_price) : null,
        max_price: form.showPriceRange ? Number(form.max_price) : null,
        price_frequency: form.showPriceRange ? form.price_frequency : null,
        salary_range_visibility: form.showPriceRange,
        cover_letter_visibility: form.requireCoverLetter,
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
        job_industry: form.job_industry,
        avatar_url: employer.avatar_url,
        educational_qualification: form.educational_qualification || null,
        agent: form.is_agent === 'true',
        condition: form.is_agent === 'true' ? form.agent_terms.trim() : null,
      };

      const { error } = await supabase.from('jobs').insert([insertObj]);

      if (error) {
        console.error('Insert job error:', error);
        setStatus({ type: 'error', text: error.message || 'Failed to post job.' });
      } else {
        setStatus({ type: 'success', text: 'Job posted successfully!' });
        setShowSuccessPopup(true); // ✅ Show success popup

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
          job_industry: JOB_INDUSTRIES[0],
          educational_qualification: '',
          is_agent: '',
          agent_terms: '',
          showPriceRange: false,
          requireCoverLetter: false,
          confirmNoPayment: false,
          confirmJobAvailable: false,
          acceptTerms: false
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

  // ✅ Improved Verification Required Modal - Responsive sizing
  const VerificationRequiredModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="min-h-[calc(100vh-2rem)] flex items-center justify-center py-8">
        <div className="bg-white rounded-2xl max-w-md w-full mx-auto border border-gray-200 shadow-2xl overflow-hidden">
          <div className="p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              {/* Warning Icon - Responsive sizing */}
              <div className="w-16 h-16 md:w-20 md:h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Shield className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />
              </div>
              
              {/* Title - Responsive font */}
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
                Identity Verification Required
              </h3>
              
              {/* Message - Responsive spacing */}
              <div className="space-y-3 md:space-y-4 text-left mb-4 md:mb-6">
                <p className="text-sm md:text-base text-gray-600">
                  To maintain a safe and trustworthy community on MyGigzz, we require all employers to verify their identity before posting jobs.
                </p>
                
                <div className="bg-blue-50 rounded-xl p-3 md:p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 text-sm md:text-base">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>Why verify?</span>
                  </h4>
                  <ul className="text-xs md:text-sm text-blue-700 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Build trust with potential applicants</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Prevent fraudulent job postings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Protect both employers and freelancers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Access more features and higher visibility</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-green-50 rounded-xl p-3 md:p-4 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2 text-sm md:text-base">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Simple process:</span>
                  </h4>
                  <p className="text-xs md:text-sm text-green-700">
                    Just upload a valid ID card and take a quick selfie. No lengthy procedures, no complicated steps. We'll review and approve within 24-48 hours.
                  </p>
                </div>
              </div>
              
              {/* Action Buttons - Responsive */}
              <div className="space-y-2 md:space-y-3">
                <button
                  onClick={() => router.push('/verification')}
                  className="w-full px-4 md:px-6 py-2.5 md:py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium text-sm md:text-base flex items-center justify-center gap-2 shadow-lg"
                >
                  <Shield className="w-4 h-4" />
                  Verify My Identity Now
                </button>
                <button
                  onClick={() => setStatus({ type: '', text: '' })}
                  className="w-full px-4 md:px-6 py-2.5 md:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium text-sm md:text-base"
                >
                  Maybe Later
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  🔒 Your information is secure and will only be used for verification purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ Improved Verification Pending Modal - Responsive sizing
  const VerificationPendingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="min-h-[calc(100vh-2rem)] flex items-center justify-center py-8">
        <div className="bg-white rounded-2xl max-w-md w-full mx-auto border border-gray-200 shadow-2xl overflow-hidden">
          <div className="p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              {/* Pending Icon - Responsive */}
              <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-orange-500" />
              </div>
              
              {/* Title - Responsive */}
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
                Verification in Progress
              </h3>
              
              {/* Message */}
              <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                <p className="text-sm md:text-base text-gray-600">
                  Your identity verification is currently being reviewed by our team. 
                  We appreciate your patience as we ensure the safety of our community.
                </p>
                
                <div className="bg-gray-50 rounded-xl p-3 md:p-4">
                  <p className="text-xs md:text-sm text-gray-700">
                    <strong className="block mb-2">What happens next?</strong>
                    Once verified, you'll be able to post jobs immediately. 
                    
                  </p>
                </div>
                
                <p className="text-xs md:text-sm text-gray-500">
                  Estimated review time: <strong>24-48 hours</strong>
                </p>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => setStatus({ type: '', text: '' })}
                className="w-full px-4 md:px-6 py-2.5 md:py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium text-sm md:text-base"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ Improved Agent Warning Modal
  const AgentWarningModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="min-h-[calc(100vh-2rem)] flex items-center justify-center py-8">
        <div className="bg-white rounded-2xl max-w-md w-full mx-auto border border-gray-200 shadow-2xl overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold">Important Notice</h3>
            </div>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              To maintain the quality and transparency of our platform, <strong>agents are not permitted to post remote jobs</strong> on MyGigzz. This helps us ensure that all remote opportunities are direct freelancing positions.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAgentWarning(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm md:text-base"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ Success Popup Modal - Shows when job is posted successfully
  const SuccessPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="min-h-[calc(100vh-2rem)] flex items-center justify-center py-8">
        <div className="bg-white rounded-2xl max-w-md w-full mx-auto border border-gray-200 shadow-2xl overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="text-center">
              {/* Success Icon */}
              <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
              </div>
              
              {/* Title */}
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
                Job Posted Successfully!
              </h3>
              
              {/* Message */}
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                Your job has been published and is now live on MyGigzz.
              </p>
              
              {/* Instructions */}
              <div className="bg-blue-50 rounded-xl p-4 mb-4 md:mb-6 border border-blue-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-blue-800 text-sm md:text-base">View Your Job</span>
                </div>
                <p className="text-xs md:text-sm text-blue-700">
                  You can view and manage your job listing in the <strong>"My Jobs"</strong> section of your dashboard.
                </p>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                  router.push('/employer-dashboard?tab=jobs');
                }}
                className="w-full px-4 md:px-6 py-2.5 md:py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium text-sm md:text-base"
              >
                Go to My Jobs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Modals */}
      {status.type === 'error' && status.text.includes('verify your identity') && (
        <VerificationRequiredModal />
      )}

      {status.type === 'error' && status.text.includes('verification is still pending') && (
        <VerificationPendingModal />
      )}

      {showAgentWarning && <AgentWarningModal />}

      {showSuccessPopup && <SuccessPopup />}

      <div className="flex items-center gap-2 md:gap-3 mb-2">
        <Activity className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
        <h2 className="text-xl md:text-2xl font-bold">Post a New Job</h2>
      </div>
      <p className="text-xs md:text-sm text-gray-600">
        Fill in the details below to publish a job. Please be honest in your responses to maintain platform transparency.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:gap-6">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="text-xs md:text-sm font-medium mb-1">Job Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Senior Developer"
              required
              className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2 text-sm md:text-base focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="text-xs md:text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleCategoryChange}
              className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2 text-sm md:text-base focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            >
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Are You an Agent? Field */}
        <div className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
          <label className="text-xs md:text-sm font-medium mb-2 md:mb-3 block">
            Are You an Agent? <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-600 mb-2 md:mb-3">
            Please be honest with your response. This helps maintain transparency in our job listings.
          </p>
          <div className="flex flex-wrap gap-4 md:gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="is_agent"
                value="true"
                checked={form.is_agent === 'true'}
                onChange={handleAgentChange}
                className="w-4 h-4 text-orange-500 focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-xs md:text-sm">Yes, I am an agent</span>
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
              <span className="text-xs md:text-sm">No, this is direct employment</span>
            </label>
          </div>
          {form.is_agent === 'true' && (
            <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Agent-posted jobs cannot be remote.
            </p>
          )}
        </div>

        {/* Agent Terms and Conditions Field */}
        {form.is_agent === 'true' && (
          <div className="bg-orange-50 p-3 md:p-4 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <FileText className="w-4 h-4 text-orange-500" />
              <label className="text-xs md:text-sm font-medium">
                Your Terms & Conditions <span className="text-red-500">*</span>
              </label>
            </div>
            <p className="text-xs text-orange-700 mb-2 md:mb-3">
              Please provide your terms and conditions for applicants.
            </p>
            <textarea
              name="agent_terms"
              value={form.agent_terms}
              onChange={handleChange}
              rows={5}
              placeholder={`• Use bullet points
• Add line breaks
• Include important details
• Specify fees or requirements`}
              required
              className="w-full border border-orange-300 rounded-lg px-3 md:px-4 py-2 bg-white text-xs md:text-sm placeholder-orange-300 font-mono focus:ring-2 focus:ring-orange-500"
            />
          </div>
        )}

        {/* Price Range Visibility Toggle */}
        <div className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="showPriceRange"
              checked={form.showPriceRange}
              onChange={handleCheckboxChange}
              className="mt-1 w-4 h-4 text-orange-500 focus:ring-2 focus:ring-orange-500 rounded flex-shrink-0"
            />
            <div>
              <span className="text-xs md:text-sm font-medium">Display price range for this job?</span>
              <p className="text-xs text-gray-500 mt-1">
                If enabled, applicants will see the salary range.
              </p>
            </div>
          </label>
        </div>

        {/* Conditional Price Range Fields */}
        {form.showPriceRange && (
          <div className="border border-gray-200 rounded-lg p-3 md:p-4 bg-white space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs md:text-sm font-medium mb-1">Min Price (₦)</label>
                <input
                  type="number"
                  name="min_price"
                  value={form.min_price}
                  onChange={handleChange}
                  placeholder="50000"
                  required={form.showPriceRange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-xs md:text-sm font-medium mb-1">Max Price (₦)</label>
                <input
                  type="number"
                  name="max_price"
                  value={form.max_price}
                  onChange={handleChange}
                  placeholder="150000"
                  required={form.showPriceRange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="sm:col-span-2 md:col-span-1">
                <label className="text-xs md:text-sm font-medium mb-1">Price Frequency</label>
                <select
                  name="price_frequency"
                  value={form.price_frequency}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                >
                  {PRICE_FREQUENCIES.map((freq) => (
                    <option key={freq} value={freq}>
                      {freq}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Row 2 - Job Type and Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="text-xs md:text-sm font-medium mb-1">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
            >
              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs md:text-sm font-medium mb-1">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Lagos, Nigeria"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label className="text-xs md:text-sm font-medium mb-1">Application Deadline</label>
          <input
            type="date"
            name="application_deadline"
            value={form.application_deadline}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs md:text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Describe the role..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Responsibilities & Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="text-xs md:text-sm font-medium mb-1">Responsibilities</label>
            <textarea
              name="responsibilities"
              value={form.responsibilities}
              onChange={handleChange}
              rows={2}
              placeholder="Duties and tasks..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="text-xs md:text-sm font-medium mb-1">Requirements</label>
            <textarea
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              rows={2}
              placeholder="Skills and experience..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Educational Qualification */}
        <div>
          <label className="text-xs md:text-sm font-medium mb-1">Educational Qualification</label>
          <input
            type="text"
            name="educational_qualification"
            value={form.educational_qualification}
            onChange={handleChange}
            placeholder="B.Sc. in Computer Science"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs md:text-sm font-medium mb-1">Tags (comma-separated)</label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleTagsChange}
            placeholder="marketing, writing, frontend"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Select Industry */}
        <div>
          <label className="text-xs md:text-sm font-medium mb-1">Select Industry</label>
          <select
            name="job_industry"
            value={form.job_industry}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
          >
            {JOB_INDUSTRIES.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        {/* Cover Letter Requirement */}
        <div className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="requireCoverLetter"
              checked={form.requireCoverLetter}
              onChange={handleCheckboxChange}
              className="mt-1 w-4 h-4 text-orange-500 focus:ring-2 focus:ring-orange-500 rounded flex-shrink-0"
            />
            <div>
              <span className="text-xs md:text-sm font-medium">Require cover letter from applicants?</span>
              <p className="text-xs text-gray-500 mt-1">
                If enabled, applicants must submit a cover letter.
              </p>
            </div>
          </label>
        </div>

        {/* Policy Confirmations */}
        <div className="space-y-2 md:space-y-3">
          <label className="flex items-start gap-2 text-xs md:text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
            <input
              type="checkbox"
              name="confirmNoPayment"
              checked={form.confirmNoPayment}
              onChange={handleCheckboxChange}
              className="mt-1 w-4 h-4 focus:ring-2 focus:ring-orange-500 flex-shrink-0"
              required
            />
            <span>Confirm no payment is required from applicants before hiring.</span>
          </label>

          <label className="flex items-start gap-2 text-xs md:text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
            <input
              type="checkbox"
              name="confirmJobAvailable"
              checked={form.confirmJobAvailable}
              onChange={handleCheckboxChange}
              className="mt-1 w-4 h-4 focus:ring-2 focus:ring-orange-500 flex-shrink-0"
              required
            />
            <span>Confirm this job is currently available.</span>
          </label>
        </div>

        {/* Terms of Use */}
        <div className="bg-orange-50 p-3 md:p-4 rounded-lg border border-orange-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={form.acceptTerms}
              onChange={handleCheckboxChange}
              className="mt-1 w-4 h-4 text-orange-500 focus:ring-2 focus:ring-orange-500 rounded flex-shrink-0"
              required
            />
            <div>
              <span className="text-xs md:text-sm font-medium text-gray-800">
                I accept the MyGigzz Terms of Use <span className="text-red-500">*</span>
              </span>
              <p className="text-xs text-orange-700 mt-1">
                By posting, you agree to our terms, privacy policy, and community guidelines.
              </p>
            </div>
          </label>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 pt-3 md:pt-4">
          <button
            type="submit"
            disabled={
              loading || 
              checkingVerification ||
              !form.confirmNoPayment || 
              !form.confirmJobAvailable || 
              !form.is_agent ||
              !form.acceptTerms ||
              (form.is_agent === 'true' && !form.agent_terms.trim()) ||
              (form.showPriceRange && (!form.min_price || !form.max_price))
            }
            className={`w-full sm:w-auto px-6 md:px-8 py-2.5 md:py-3 rounded-full transition font-medium text-sm md:text-base ${
              loading || 
              checkingVerification ||
              !form.confirmNoPayment || 
              !form.confirmJobAvailable || 
              !form.is_agent ||
              !form.acceptTerms ||
              (form.is_agent === 'true' && !form.agent_terms.trim()) ||
              (form.showPriceRange && (!form.min_price || !form.max_price))
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-black text-white hover:bg-orange-600 hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            {loading || checkingVerification ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {checkingVerification ? 'Checking...' : 'Posting...'}
              </span>
            ) : (
              "Post Job"
            )}
          </button>

          {status.text && !status.text.includes('verify your identity') && !status.text.includes('verification is still pending') && (
            <p className={`text-xs md:text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {status.text}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}