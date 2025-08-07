import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import Header from '../../components/Header';
import MobileHeader from '../../components/MobileHeader';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import JobCard from '../../components/JobCard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [job, setJob] = useState(null);
  const [poster, setPoster] = useState(null);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [user, setUser] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);

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

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('token_balance')
          .eq('id', user.id)
          .single();
        setTokenBalance(profile?.token_balance || 0);
      }
    };
    fetchAuthUser();
  }, []);

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

        const { data: similar } = await supabase
          .from('jobs')
          .select('*')
          .neq('id', id)
          .ilike('category', `%${jobData.category}%`)
          .limit(5);

        setSimilarJobs(similar);
      }
    };
    fetchJob();
  }, [id]);

  const handleApply = async () => {
    if (!user) {
      setModalMessage(
        '❌ Application not honored! You must login and get Gigzz token to apply for this job.'
      );
      setShowModal(true);
      return;
    }

    if (tokenBalance <= 0) {
      setModalMessage(
        '⚠️ Kindly go to your dashboard and fund your token to apply for any job on Gigzz.'
      );
      setShowModal(true);
      return;
    }

    // Deduct 1 token
    const { error } = await supabase
      .from('profiles')
      .update({ token_balance: tokenBalance - 1 })
      .eq('id', user.id);

    setTokenBalance((prev) => prev - 1);
    const { error: appError } = await supabase
  .from('applications')
  .insert([{ applicant_id: user.id, job_id: job.id }]);

if (appError) {
  setModalMessage('❌ Failed to record your application. Please try again.');
  setShowModal(true);
  return;
}

setModalMessage('🎉 Application successful! 1 token has been deducted from your wallet. Good luck as you await a response from the client.');

    setShowModal(true);
  };

  if (!job) return <div className="p-4">Loading job details...</div>;

  return (
    <div className="bg-white text-black min-h-screen">
      {isMobile ? <MobileHeader /> : <Header />}

      <div className="max-w-4xl mx-auto px-4 py-10 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Poster Avatar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img
                src={poster?.avatar_url || 'https://i.pravatar.cc/60?img=5'}
                alt="Poster Avatar"
                className="w-12 h-12 rounded-full object-cover"
              />
              <p className="text-sm text-gray-500">
                {poster?.verified ? (
                  <span className="text-green-600">✔ Verified Employer</span>
                ) : (
                  <span className="text-red-600">✖ Unverified Employer</span>
                )}
              </p>
            </div>
          </div>

          {/* Title & Tags */}
          <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
          <div className="flex flex-wrap text-sm text-gray-600 gap-2 mb-4">
            <span className="bg-gray-100 px-2 py-1 rounded">{job.category}</span>
            <span className="bg-gray-100 px-2 py-1 rounded">{job.type}</span>
            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
              {job.promotion_tag}
            </span>
          </div>

          {/* Pay & Deadline */}
          <p className="text-lg font-semibold mb-1">
            ₦{job.price_range} ({job.price_frequency})
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Deadline: {job.application_deadline}
          </p>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
          </div>

          {/* Responsibilities */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Responsibilities</h2>
            <p className="text-gray-700 whitespace-pre-line">{job.responsibilities}</p>
          </div>

          {/* Requirements */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Requirements & Skills</h2>
            <p className="text-gray-700 whitespace-pre-line">{job.requirements}</p>
          </div>

          {/* Location */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Location</h2>
            <p className="text-gray-700">{job.location}</p>
          </div>

          {/* Apply Button */}
          <div className="mt-8 mb-12">
            <button
              onClick={handleApply}
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition"
            >
              Apply Now
            </button>
          </div>

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
