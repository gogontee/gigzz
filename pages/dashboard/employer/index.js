// pages/dashboard/employer/index.js
'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';

import Sidebar from '../../../components/dashboard/ClientSidebar';
import JobPostForm from '../../../components/client/JobPostForm';
import WalletSummary from '../../../components/client/WalletSummary';
import VideoCallModal from '../../../components/client/VideoCallModal';
import EmployerProfileEditor from '../../../components/client/EmployerProfileEditor';
import PromotionPanel from '../../../components/client/PromotionPanel';
import JobListCard from '../../../components/client/JobListCard';
import Verify from '../../../components/Verify';
import Messages from '../../../components/Messages';
import Portfolio from '../../../components/Portfolios'; // ✅ import Portfolio component

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const isValidComponent = (Comp) =>
  typeof Comp === 'function' || (typeof Comp === 'object' && Comp !== null);

export default function EmployerDashboard() {
  const router = useRouter();
  const [employer, setEmployer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [importErrors, setImportErrors] = useState([]);

  useEffect(() => {
    const errs = [];
    if (!isValidComponent(Sidebar)) errs.push('ClientSidebar');
    if (!isValidComponent(JobPostForm)) errs.push('JobPostForm');
    if (!isValidComponent(WalletSummary)) errs.push('WalletSummary');
    if (!isValidComponent(VideoCallModal)) errs.push('VideoCallModal');
    if (!isValidComponent(EmployerProfileEditor)) errs.push('EmployerProfileEditor');
    if (!isValidComponent(PromotionPanel)) errs.push('PromotionPanel');
    if (!isValidComponent(JobListCard)) errs.push('JobListCard');
    if (!isValidComponent(Verify)) errs.push('Verify');
    if (!isValidComponent(Messages)) errs.push('Messages');
    if (!isValidComponent(Portfolio)) errs.push('Portfolios');
    setImportErrors(errs);
  }, []);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      router.replace('/auth/login');
      return;
    }

    // fetch employer
    const { data: employerData, error: empErr } = await supabase
      .from('employers')
      .select('*')
      .eq('id', user.id)
      .single();

    if (empErr || !employerData) {
      console.error('Failed to load employer:', empErr);
      setLoading(false);
      return;
    }

    // fetch jobs
    const { data: jobPosts } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', user.id)
      .order('created_at', { ascending: false });

    // fetch wallet
    const { data: walletData } = await supabase
      .from('token_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setEmployer(employerData);
    setJobs(jobPosts || []);
    setWallet(walletData);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  if (loading) return <div className="p-6">Loading...</div>;

  if (importErrors.length > 0) {
    return (
      <div className="min-h-screen flex items-start p-8 bg-white text-black">
        <div className="max-w-xl mx-auto w-full">
          <div className="bg-red-50 border border-red-300 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Component Import Errors</h2>
            <ul className="list-disc list-inside mt-2 text-red-700">
              {importErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-black lg:mt-14">
      <Sidebar active={activeSection} onChange={setActiveSection} employer={employer} />

      <div className="flex-1 overflow-auto">
        {/* header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 lg:pt-20">
          <div className="flex gap-4 items-center">
            <h1 className="text-base lg:text-2xl font-bold">
              Welcome {employer?.name || 'Client'}
            </h1>
          </div>
          <div className="flex gap-4">
            <WalletSummary wallet={wallet} />
            <button
              onClick={() => setActiveSection('post')}
              className="bg-black text-white px-3 py-1.5 text-sm rounded-lg hover:bg-orange-600 transition lg:px-4 lg:py-2 lg:text-base lg:rounded-full"
            >
              Post Job
            </button>
          </div>
        </div>

        {/* content panel */}
        <div className="p-6">
          {activeSection === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                {/* jobs */}
                <div className="rounded-xl bg-white shadow p-6">
                  <h2 className="text-xl font-semibold mb-2">Your Jobs</h2>
                  {jobs.length === 0 ? (
                    <p className="text-gray-600">No jobs posted yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {jobs.map((j) => (
                        <JobListCard key={j.id} job={j} onEdit={() => setActiveSection('jobs')} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-6">
                <PromotionPanel jobs={jobs} wallet={wallet} refresh={fetchInitial} />
              </div>
            </div>
          )}

          {activeSection === 'post' && employer && (
            <JobPostForm employerId={employer.id} onPosted={fetchInitial} />
          )}

          {activeSection === 'jobs' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">My Jobs</h2>
              <div className="space-y-4">
                {jobs.map((j) => (
                  <JobListCard key={j.id} job={j} onEdit={() => setActiveSection('post')} />
                ))}
              </div>
            </div>
          )}

          {activeSection === 'wallet' && (
            <div>
              <WalletSummary wallet={wallet} />
            </div>
          )}

          {activeSection === 'profile' && employer && (
            <EmployerProfileEditor employer={employer} onUpdated={fetchInitial} />
          )}

          {activeSection === 'verify' && employer && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Verify Your Identity</h2>
              <Verify employer={employer} />
            </div>
          )}

          {/* ✅ Show Messages instead of ChatSidebar */}
          {activeSection === 'chats' && <Messages />}

          {/* ✅ Show Portfolio component */}
          {activeSection === 'portfolios' && <Portfolio />}

          {activeSection === 'calls' && <VideoCallModal />}
        </div>
      </div>
    </div>
  );
}
