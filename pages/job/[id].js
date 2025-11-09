'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import Header from '../../components/Header';
import MobileHeader from '../../components/MobileHeader';
import Footer from '../../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import JobCard from '../../components/JobCard';
import { MapPin, Clock, DollarSign, FileText } from "lucide-react";


export const supabase = createPagesBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ALLOWED_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/svg+xml',
  'application/pdf'
];

const tabVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

const cardHoverVariants = {
  hover: { scale: 1.03, transition: { duration: 0.2 } }
};

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [job, setJob] = useState(null);
  const [poster, setPoster] = useState(null);
  const [verifications, setVerifications] = useState(null);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('description');

  // form states
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [links, setLinks] = useState(['']);
  const [submitting, setSubmitting] = useState(false);

  // application state
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // agent terms state
  const [showAgentTerms, setShowAgentTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchAuthUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      setUser(user);

      if (user && id) {
        const { data: existingApp } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', id)
          .eq('applicant_id', user.id)
          .maybeSingle();

        if (existingApp) setAlreadyApplied(true);
      }
    };
    fetchAuthUser();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (jobData) {
        setJob(jobData);

        const { data: posterData } = await supabase
          .from('employers')
          .select('*')
          .eq('id', jobData.employer_id)
          .single();

        setPoster(posterData);

        const { data: verif } = await supabase
          .from('verifications')
          .select('*')
          .eq('user_id', posterData?.id)
          .single();

        setVerifications(verif);

        const { data: similar } = await supabase
          .from('jobs')
          .select('*')
          .neq('id', id)
          .ilike('category', `%${jobData.category}%`)
          .limit(5);

        setSimilarJobs(similar || []);
      }
    };
    fetchJob();
  }, [id]);

  const handleApply = async () => {
    if (!user) {
      setModalMessage('❌ You must login to apply for this job.');
      setShowModal(true);
      return;
    }

    const { data: employerCheck } = await supabase
      .from('employers')
      .select('id')
      .eq('id', user.id)
      .single();

    if (employerCheck) {
      setModalMessage(
        '⚠️ You cannot apply to jobs using a Client account. Please signup as a Creative to apply.'
      );
      setShowModal(true);
      return;
    }

    if (alreadyApplied) {
      setModalMessage('⚠️ You have already applied for this job.');
      setShowModal(true);
      return;
    }

    if (!coverLetter.trim()) {
      setModalMessage('⚠️ Please write a cover letter.');
      setShowModal(true);
      return;
    }

    if (coverLetter.length > 1500) {
      setModalMessage('⚠️ Cover letter cannot exceed 1500 characters.');
      setShowModal(true);
      return;
    }

    // Check if agent terms need to be accepted
    if (job?.condition && !acceptedTerms) {
      setModalMessage('⚠️ Please read and accept the agent terms and conditions.');
      setShowModal(true);
      return;
    }

    setSubmitting(true);

    const { data: wallet, error: walletErr } = await supabase
      .from('token_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (walletErr || !wallet || wallet.balance < 3) {
      setSubmitting(false);
      setModalMessage(
        '⚠️ Insufficient token balance. Kindly fund your token and try again.'
      );
      setShowModal(true);
      return;
    }

    const { error: updateError } = await supabase
      .from('token_wallets')
      .update({
        balance: wallet.balance - 3,
        last_action: `Application for ${job.title}`,
      })
      .eq('user_id', user.id);

    if (updateError) {
      setSubmitting(false);
      setModalMessage('❌ Failed to deduct tokens. Try again.');
      setShowModal(true);
      return;
    }

    const validFiles = attachments.filter(Boolean);
    let attachmentUrls = [];
    for (let file of validFiles) {
      if (!ALLOWED_MIME.includes(file.type)) {
        setSubmitting(false);
        setModalMessage('❌ Invalid file type detected. Allowed: jpg, jpeg, png, svg, pdf');
        setShowModal(true);
        return;
      }
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(path, file, { upsert: false, contentType: file.type });

      if (uploadError) {
        console.error(uploadError);
        setSubmitting(false);
        setModalMessage('❌ Failed to upload attachment(s).');
        setShowModal(true);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(path);
      attachmentUrls.push(publicUrlData.publicUrl);
    }

    const { error } = await supabase.from('applications').insert([
      {
        job_id: job.id,
        applicant_id: user.id,
        cover_letter: coverLetter,
        amount: bidAmount ? Number(bidAmount) : null,
        attachment: attachmentUrls.length > 0 ? attachmentUrls : null,
        links: links.filter((l) => l.trim() !== '')
      }
    ]);

    setSubmitting(false);

    if (error) {
      console.error(error);
      setModalMessage('❌ Something went wrong. Please try again.');
      setShowModal(true);
      return;
    }

    setAlreadyApplied(true);
    setModalMessage('🎉 Application successful! 3 tokens have been deducted.');
    setShowModal(true);

    setCoverLetter('');
    setBidAmount('');
    setAttachments([]);
    setLinks(['']);
    setAcceptedTerms(false);
  };

  const handleFileChange = (e, idx) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME.includes(file.type)) {
      alert('Invalid file type. Allowed: jpg, jpeg, png, svg, pdf');
      return;
    }

    const next = [...attachments];
    next[idx] = file;
    setAttachments(next);

    if (idx === attachments.length - 1 && attachments.length < 5) {
      setAttachments([...next, null]);
    }
  };

  const addAttachmentField = () => {
    if (attachments.length === 0) setAttachments([null]);
    else if (attachments.length < 5) setAttachments([...attachments, null]);
  };

  const shareJob = () => {
    const shareUrl = `${window.location.origin}/job/${id}`;
    if (navigator.share) {
      navigator.share({ title: job?.title || 'Gigzz Job', url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Job link copied to clipboard!');
    }
  };

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'responsibilities', label: 'Responsibilities' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'qualification', label: 'Qualification' },
    { id: 'location', label: 'Location' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'description':
        return (
          <motion.div
            key="description"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="prose prose-gray max-w-none"
          >
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </motion.div>
        );
      case 'responsibilities':
        return (
          <motion.div
            key="responsibilities"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {job.responsibilities}
            </p>
          </motion.div>
        );
      case 'requirements':
        return (
          <motion.div
            key="requirements"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {job.requirements}
            </p>
          </motion.div>
        );
      case 'qualification':
        return (
          <motion.div
            key="qualification"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {job.educational_qualification || 'No specific qualification required.'}
            </p>
          </motion.div>
        );
      case 'location':
        return (
          <motion.div
            key="location"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className="text-gray-700 text-lg font-medium">{job.location}</p>
          </motion.div>
        );
      default:
        return null;
    }
  };

  if (!job) return <div className="p-4">Loading job details...</div>;

  const formattedPay =
    job.min_price && job.max_price
      ? `₦${Number(job.min_price).toLocaleString()} - ₦${Number(job.max_price).toLocaleString()}`
      : job.min_price
      ? `₦${Number(job.min_price).toLocaleString()}`
      : job.max_price
      ? `₦${Number(job.max_price).toLocaleString()}`
      : 'N/A';

  const isVerified = verifications?.approved?.toLowerCase() === 'verified';
  const getVerificationDot = () => {
    if (!verifications?.approved) return 'black';
    switch (verifications.approved.toLowerCase()) {
      case 'pending':
        return 'orange';
      case 'unverified':
      case 'unverify':
      default:
        return 'black';
    }
  };

  const renderForm = () => (
    <motion.div 
      className="border border-gray-200 rounded-2xl p-6 shadow-lg bg-white"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {!alreadyApplied && (
        <h2 className="text-xl font-bold mb-4 text-gray-900">Apply to this Job</h2>
      )}

      {/* Agent Tag */}
      {job.condition && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium border border-orange-200">
            🤝 Agent Posted Job
          </span>
        </div>
      )}

      {alreadyApplied ? (
        <div className="text-center">
          <button
            disabled
            className="mt-4 w-full bg-gray-400 text-white px-6 py-3 rounded-xl cursor-not-allowed font-medium"
          >
            Already Applied
          </button>
          <p className="mt-3 text-sm text-gray-600">
            Kindly wait for the client to contact you. Wishing you best of luck 🍀
          </p>
          <motion.button
            onClick={shareJob}
            className="mt-4 w-full border-2 border-black text-black px-6 py-3 rounded-xl hover:bg-orange-50 transition-all duration-200 font-medium"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Share this Job
          </motion.button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-900 mb-2 block">Cover Letter</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Write a short cover letter (max 1500 characters)..."
              maxLength={1500}
              rows={5}
              className="w-full border border-gray-300 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200"
            />
            <p className="text-xs text-gray-500 mt-2">{coverLetter.length}/1500</p>
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-900 mb-2 block">Your Bid (₦)</label>
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="Enter your bid amount"
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-900">Attachments</label>
              <span className="text-xs text-gray-500">Max 5 • JPG, JPEG, PNG, SVG, PDF</span>
            </div>

            {attachments.length === 0 && (
              <div className="mb-3">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg,.pdf"
                  onChange={(e) => handleFileChange(e, 0)}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-orange-400 transition-all duration-200"
                />
              </div>
            )}

            {attachments.map((att, idx) => (
              <div key={idx} className="mb-3">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg,.pdf"
                  onChange={(e) => handleFileChange(e, idx)}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-orange-400 transition-all duration-200"
                />
                {idx === attachments.length - 1 && attachments.length < 5 && att && (
                  <p className="text-xs text-green-600 mt-2">
                    ✅ File added. Would you like to add more attachments?
                  </p>
                )}
              </div>
            ))}

            {attachments.length > 0 && attachments.length < 5 && (
              <motion.button
                type="button"
                onClick={addAttachmentField}
                className="text-sm text-black hover:text-orange-400 font-medium transition-colors duration-200 flex items-center gap-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                + Add more attachments
              </motion.button>
            )}
          </div>

          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-900 mb-2 block">Links (max 3)</label>
            {links.map((lnk, idx) => (
              <input
                key={idx}
                value={lnk}
                onChange={(e) => {
                  const newLinks = [...links];
                  newLinks[idx] = e.target.value;
                  if (idx === links.length - 1 && links.length < 3) {
                    newLinks.push('');
                  }
                  setLinks(newLinks);
                }}
                placeholder="Enter link URL"
                className="w-full border border-gray-300 rounded-xl p-3 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200"
              />
            ))}
          </div>

          {/* Agent Terms Section */}
          {job.condition && (
            <div className="mb-6">
              <motion.button
                type="button"
                onClick={() => setShowAgentTerms(!showAgentTerms)}
                className="w-full text-left p-4 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold text-orange-800">See Agent Terms & Conditions</span>
                  </div>
                  <motion.div
                    animate={{ rotate: showAgentTerms ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </div>
              </motion.button>

              <AnimatePresence>
                {showAgentTerms && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 p-4 bg-white border border-orange-200 rounded-xl"
                  >
                    <h4 className="font-semibold text-gray-900 mb-3">Agent Terms & Conditions</h4>
                    <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {job.condition}
                    </div>
                    
                    <label className="flex items-start gap-3 mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          I have read and accept the agent's terms and conditions
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          By checking this box, you acknowledge that you understand and agree to the terms set by the agent.
                        </p>
                      </div>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <motion.button
            onClick={handleApply}
            disabled={submitting || (job.condition && !acceptedTerms)}
            className="w-full bg-black text-white px-6 py-3 rounded-xl hover:bg-orange-400 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: submitting ? 1 : 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </motion.button>

          <motion.button
            type="button"
            onClick={shareJob}
            className="mt-3 w-full border-2 border-black text-black px-6 py-3 rounded-xl hover:bg-orange-50 transition-all duration-200 font-semibold"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Share this Job
          </motion.button>
        </>
      )}
    </motion.div>
  );

  return (
    <div className="bg-white text-black min-h-screen">
      {isMobile ? <MobileHeader /> : <Header />}

      <div className="max-w-7xl mx-auto px-4 py-8 md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={isMobile ? '' : 'grid grid-cols-1 lg:grid-cols-4 gap-8'}
        >
          {/* Main Content */}
          <div className={isMobile ? '' : 'lg:col-span-3'}>
            {/* Header Section */}
            <motion.div 
              className="bg-gradient-to-r from-black to-gray-900 rounded-2xl p-6 md:p-8 text-white mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <img
                        src={poster?.avatar_url || 'https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png'}
                        alt="Poster Avatar"
                        className="w-16 h-16 rounded-full object-cover border-2 border-white"
                      />
                      {!isVerified && (
                        <span
                          className="absolute w-4 h-4 rounded-full border-2 border-white"
                          style={{ backgroundColor: getVerificationDot(), bottom: 0, right: 0 }}
                        />
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-4xl font-bold mb-2">{job.title}</h1>
                      <div className="flex flex-wrap items-center gap-2">
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 bg-green-600 px-3 py-1 rounded-full text-xs font-medium">
                            ✔ Verified Employer
                          </span>
                        )}
                        {job.condition && (
                          <span className="inline-flex items-center gap-1 bg-orange-400 px-3 py-1 rounded-full text-xs font-medium">
                            🤝 Agent Posted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                      {job.category}
                    </span>
                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                      {job.type}
                    </span>
                    {job.promotion_tag && (
                      <span className="bg-orange-400 px-3 py-1 rounded-full text-sm font-semibold">
                        {job.promotion_tag}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div>
                      <p className="text-2xl font-bold text-orange-400">{formattedPay}</p>
                      {job.price_frequency && (
                        <p className="text-gray-300 text-sm">{job.price_frequency}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300">Deadline:</span>
                      <span className="font-semibold">{job.application_deadline}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tabs Section */}
            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'border-orange-400 text-orange-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="mt-6 min-h-[200px]">
                <AnimatePresence mode="wait">
                  {renderTabContent()}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Form */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mb-8"
              >
                {renderForm()}
              </motion.div>
            )}

            {/* Similar Jobs */}
            <motion.div 
              className="mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Similar Jobs</h3>
              {similarJobs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No similar jobs found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {similarJobs.map((similarJob) => (
                    <motion.div
                      key={similarJob.id}
                      variants={cardHoverVariants}
                      whileHover="hover"
                    >
                      <JobCard key={similarJob.id} job={similarJob} viewMode="list" />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Desktop Sidebar */}
          {!isMobile && (
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="sticky top-24"
              >
                {renderForm()}
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>

      {!isMobile && <Footer />}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <p className="text-gray-700 mb-6 text-center">{modalMessage}</p>
              <motion.button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-3 text-sm bg-black text-white rounded-xl hover:bg-orange-400 transition-all duration-200 font-semibold"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                OK
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}