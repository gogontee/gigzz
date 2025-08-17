// pages/dashboard/employer/index.js
'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Image from 'next/image';

import Sidebar from '../../../components/dashboard/ClientSidebar';
import JobPostForm from '../../../components/client/JobPostForm';
import WalletSummary from '../../../components/client/WalletSummary';
import PortfolioBrowser from '../../../components/client/PortfolioBrowser';
import ChatSidebar from '../../../components/client/ChatSidebar';
import VideoCallModal from '../../../components/client/VideoCallModal';
import EmployerProfileEditor from '../../../components/client/EmployerProfileEditor';
import PromotionPanel from '../../../components/client/PromotionPanel';
import JobListCard from '../../../components/client/JobListCard';
import Verify from '../../../components/Verify';
import PortfolioModal from '../../../components/portfolio/PortfolioModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Simple validation helper
const isValidComponent = (Comp) => typeof Comp === 'function' || (typeof Comp === 'object' && Comp !== null);

export default function EmployerDashboard() {
  const router = useRouter();
  const [employer, setEmployer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [importErrors, setImportErrors] = useState([]);

  // Validate imported components on mount
  useEffect(() => {
    const errs = [];
    if (!isValidComponent(Sidebar)) errs.push('ClientSidebar');
    if (!isValidComponent(JobPostForm)) errs.push('JobPostForm');
    if (!isValidComponent(WalletSummary)) errs.push('WalletSummary');
    if (!isValidComponent(PortfolioBrowser)) errs.push('PortfolioBrowser');
    if (!isValidComponent(ChatSidebar)) errs.push('ChatSidebar');
    if (!isValidComponent(VideoCallModal)) errs.push('VideoCallModal');
    if (!isValidComponent(EmployerProfileEditor)) errs.push('EmployerProfileEditor');
    if (!isValidComponent(PromotionPanel)) errs.push('PromotionPanel');
    if (!isValidComponent(Verify)) errs.push('Verify');
    if (!isValidComponent(JobListCard)) errs.push('JobListCard');
    setImportErrors(errs);
  }, []);

  // Add these inside EmployerDashboard, alongside other useState declarations:
const [selectedPortfolio, setSelectedPortfolio] = useState(null);
const [showPortfolioModal, setShowPortfolioModal] = useState(false);

const handleViewPortfolio = (p) => {
  setSelectedPortfolio(p);
  setShowPortfolioModal(true);
};

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

    const { data: jobPosts } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', user.id)
      .order('created_at', { ascending: false });

    const { data: walletData } = await supabase
      .from('client_wallets')
      .select('*')
      .eq('employer_id', user.id)
      .single();

    const { data: portfolioData } = await supabase
      .from('portfolios')
      .select('*')
      .limit(6)
      .order('created_at', { ascending: false });

    setEmployer(employerData);
    setJobs(jobPosts || []);
    setWallet(walletData);
    setPortfolios(portfolioData || []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  if (loading) return <div className="p-6">Loading...</div>;

  // If any import errors, show them plainly
  if (importErrors.length > 0) {
    return (
      <div className="min-h-screen flex items-start p-8 bg-white text-black">
        <div className="max-w-xl mx-auto w-full">
          <div className="bg-red-50 border border-red-300 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Component Import Errors</h2>
            <p className="text-sm text-red-700">
              The following components failed to import properly or are not exported as defaults:
            </p>
            <ul className="list-disc list-inside mt-2 text-red-700">
              {importErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              Check that each file does a default export, e.g. <code>export default function ComponentName()</code>, and that the import paths are correct.
            </p>
          </div>
          <div className="rounded-xl bg-white shadow p-6">
            <p className="text-gray-700">Dashboard cannot load fully until those issues are resolved.</p>
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
            <h1 className="text-xl lg:text-2xl font-bold">
  Welcome {employer?.name || 'Client'}
</h1>

          </div>
          <div className="flex gap-4">
            <WalletSummary wallet={wallet} />
            <button
              onClick={() => setActiveSection('post')}
              className="bg-black text-white px-4 py-2 rounded-full hover:bg-orange-600 transition"
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
                <div className="rounded-xl bg-white shadow p-6">
  <h2 className="text-xl font-semibold mb-2">Featured Creatives</h2>
  <PortfolioBrowser portfolios={portfolios} onView={handleViewPortfolio} />
</div>
{selectedPortfolio && (
  <PortfolioModal
    open={showPortfolioModal}
    setOpen={setShowPortfolioModal}
    portfolio={selectedPortfolio}
    readOnly={true} // if you implement a prop to disable edits
    onSuccess={() => {
      setShowPortfolioModal(false);
    }}
  />
)}
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
              <div className="mt-4">{/* fund / promote UI */}</div>
            </div>
          )}

          {activeSection === 'portfolios' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Browse Portfolios</h2>
              <PortfolioBrowser portfolios={portfolios} onView={() => {}} />
            </div>
          )}

          {activeSection === 'profile' && employer && (
            <EmployerProfileEditor employer={employer} onUpdated={fetchInitial} />
          )}
          
          {activeSection === 'verify' && employer && (
            <Verify employer={employer} onUpdated={fetchInitial} />
          )}

          {activeSection === 'chats' && employer && <ChatSidebar employer={employer} />}
          {activeSection === 'calls' && <VideoCallModal />}
        </div>
      </div>
    </div>
  );
}
