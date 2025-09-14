'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import Header from '../../components/Header';
import MobileHeader from '../../components/MobileHeader';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import JobCard from '../../components/JobCard';

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

  // form states
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [attachments, setAttachments] = useState([]); // File | null slots
  const [links, setLinks] = useState(['']);
  const [submitting, setSubmitting] = useState(false);

  // application state
  const [alreadyApplied, setAlreadyApplied] = useState(false);

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

  // Check user role first
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

  setSubmitting(true);

  // 1) Check tokens
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

    // 2) Deduct 3 tokens
    const { error: updateError } = await supabase
  .from('token_wallets')
  .update({
    balance: wallet.balance - 3,
    last_action: `Application for ${job.title}`, // ✅ inside the object
  })
  .eq('user_id', user.id);


    if (updateError) {
      setSubmitting(false);
      setModalMessage('❌ Failed to deduct tokens. Try again.');
      setShowModal(true);
      return;
    }

    // 3) Upload attachments (if any)
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

    // 4) Insert application
    const { error } = await supabase.from('applications').insert([
      {
        job_id: job.id,
        applicant_id: user.id,
        cover_letter: coverLetter,
        amount: bidAmount ? Number(bidAmount) : null,
        attachment: attachmentUrls.length > 0 ? attachmentUrls : null, // ✅ match schema
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

  if (!job) return <div className="p-4">Loading job details...</div>;

  // helpers for job info UI
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

  // form UI
  const renderForm = () => (
    <div className="border rounded-xl p-4 shadow-sm bg-gray-50">
      {!alreadyApplied && <h2 className="text-lg font-semibold mb-2">Apply to this Job</h2>}

      {alreadyApplied ? (
        <div className="text-center">
          <button
            disabled
            className="mt-4 w-full bg-black text-white px-6 py-2 rounded cursor-not-allowed"
          >
            Already Applied
          </button>
          <p className="mt-2 text-sm text-gray-600">
            Kindly wait for the client to contact you. Wishing you best of luck 🍀
          </p>
          <button
            onClick={shareJob}
            className="mt-4 w-full border border-black text-black px-6 py-2 rounded hover:bg-orange-50 transition"
          >
            Share this Job
          </button>
        </div>
      ) : (
        <>
          <label className="text-sm font-medium">Cover Letter</label>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Write a short cover letter (max 1500 characters)..."
            maxLength={1500}
            rows={5}
            className="w-full border rounded-lg p-3 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <p className="text-xs text-gray-500 mb-3">{coverLetter.length}/1500</p>

          <label className="text-sm font-medium">Your Bid (₦)</label>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Enter your bid amount"
            className="w-full border rounded-lg p-2 text-sm mb-3"
          />

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Attachments <span className="text-gray-500">(optional)</span></label>
            <span className="text-xs text-gray-500">Max 5 • JPG, JPEG, PNG, SVG, PDF</span>
          </div>

          {/* First slot appears only after user adds or we add initial slot */}
          {attachments.length === 0 && (
            <div className="mb-2">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.svg,.pdf"
                onChange={(e) => handleFileChange(e, 0)}
                className="w-full border rounded-lg p-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload your attachment (jpg, jpeg, png, svg, pdf).
              </p>
            </div>
          )}

          {/* Additional unfolding slots */}
          {attachments.map((att, idx) => (
            <div key={idx} className="mb-2">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.svg,.pdf"
                onChange={(e) => handleFileChange(e, idx)}
                className="w-full border rounded-lg p-2 text-sm"
              />
              {idx === attachments.length - 1 && attachments.length < 5 && att && (
                <p className="text-xs text-gray-600 mt-1">
                  ✅ File added. Would you like to add more attachments?
                </p>
              )}
            </div>
          ))}

          {/* Manual add (+) */}
          {attachments.length > 0 && attachments.length < 5 && (
  <button
    type="button"
    onClick={addAttachmentField}
  >
    + Add more
  </button>
)}


          <div className="mt-4">
            <label className="text-sm font-medium">Links (max 3)</label>
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
                className="w-full border rounded-lg p-2 text-sm mb-2"
              />
            ))}
          </div>

          <button
            onClick={handleApply}
            disabled={submitting}
            className="mt-4 w-full bg-black text-white px-6 py-2 rounded hover:bg-orange-500 transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>

          <button
            type="button"
            onClick={shareJob}
            className="mt-3 w-full border border-black text-black px-6 py-2 rounded hover:bg-orange-50 transition"
          >
            Share this Job
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="bg-white text-black min-h-screen">
      {isMobile ? <MobileHeader /> : <Header />}

      <div className="max-w-5xl mx-auto px-4 py-10 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={isMobile ? '' : 'grid grid-cols-1 md:grid-cols-3 gap-8'}
        >
          {/* Job Details */}
          <div className={isMobile ? '' : 'md:col-span-2'}>
            {/* Poster Avatar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col items-center gap-2 relative">
                <div className="relative">
                  <img
                    src={poster?.avatar_url || 'https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png'}
                    alt="Poster Avatar"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {!isVerified && (
                    <span
                      className="absolute w-3 h-3 rounded-full border-2 border-white"
                      style={{ backgroundColor: getVerificationDot(), bottom: 0, right: 0 }}
                    />
                  )}
                </div>
                {isVerified && <p className="text-[10px] text-green-600">✔ Verified</p>}
              </div>
            </div>

            {/* Title & Tags */}
            <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
            <div className="flex flex-wrap text-sm text-gray-600 gap-2 mb-4">
              <span className="bg-gray-100 px-2 py-1 rounded">{job.category}</span>
              <span className="bg-gray-100 px-2 py-1 rounded">{job.type}</span>
              {job.promotion_tag && (
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  {job.promotion_tag}
                </span>
              )}
            </div>

            {/* Pay & Price Frequency */}
            <p className="text-lg font-semibold mb-1 text-orange-400">{formattedPay}</p>
            {job.price_frequency && (
              <p className="text-sm text-gray-600 mb-4">{job.price_frequency}</p>
            )}

            {/* Deadline */}
            <p className="text-sm text-gray-600 mb-4">
              Deadline: {job.application_deadline}
            </p>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2 text-orange-400">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>

            {/* Responsibilities */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2 text-orange-400">Responsibilities</h2>
              <p className="text-gray-700 whitespace-pre-line">{job.responsibilities}</p>
            </div>

            {/* Requirements */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2 text-orange-400">Requirements & Skills</h2>
              <p className="text-gray-700 whitespace-pre-line">{job.requirements}</p>
            </div>

            {/* Educational Qualification */}
{job.educational_qualification && (
  <div className="mb-6">
    <h2 className="text-xl font-bold mb-2 text-orange-400">Qualification</h2>
    <p className="text-gray-700 whitespace-pre-line">
      {job.educational_qualification}
    </p>
  </div>
)}

            {/* Location */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2 text-orange-400">Location</h2>
              <p className="text-gray-700">{job.location}</p>
            </div>

            {/* Mobile form inline */}
            {isMobile && renderForm()}

            {/* Similar Jobs */}
            <div className="mt-10">
              <h3 className="text-lg font-semibold mb-4">Similar Jobs</h3>
              {similarJobs.length === 0 ? (
                <p className="text-gray-500">No similar jobs found.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {similarJobs.map((similarJob) => (
                    <JobCard key={similarJob.id} job={similarJob} viewMode="list" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop form sidebar */}
          {!isMobile && <div className="md:col-span-1 sticky top-20">{renderForm()}</div>}
        </motion.div>
      </div>

      {!isMobile && <Footer />}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-md text-center shadow-xl">
            <p className="text-gray-700 mb-4">{modalMessage}</p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-2 px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
