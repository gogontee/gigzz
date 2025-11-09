'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

import Sidebar from '../../../components/dashboard/ClientSidebar';
import JobPostForm from '../../../components/client/JobPostForm';
import WalletSummary from '../../../components/client/WalletSummary';
import VideoCallModal from '../../../components/client/VideoCallModal';
import EmployerProfileEditor from '../../../components/client/EmployerProfileEditor';
import PromotionPanel from '../../../components/client/PromotionPanel';
import JobListCard from '../../../components/client/JobListCard';
import Verify from '../../../components/Verify';
import Messages from '../../../components/Messages';
import Portfolio from '../../../components/Portfolios';
import Wallet from '../../../components/WalletComponent'; // ✅ Changed from Token to Wallet

const isValidComponent = (Comp) =>
  typeof Comp === 'function' || (typeof Comp === 'object' && Comp !== null);

export default function EmployerDashboard() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();

  const [employer, setEmployer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [importErrors, setImportErrors] = useState([]);

  // pagination states
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // ✅ check imports once
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
    if (!isValidComponent(Wallet)) errs.push('Wallet'); // ✅ Updated to Wallet
    setImportErrors(errs);
  }, []);

  // ✅ fetch initial data
  const fetchInitial = useCallback(async () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    setLoading(true);

    try {
      // employer
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

      // jobs first 10
      const { data: jobPosts, error: jobErr } = await supabase
        .from('jobs')
        .select('*')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false })
        .range(0, 9); // 10 jobs

      if (jobErr) console.error('Failed to load jobs:', jobErr);

      // wallet
      const { data: walletData } = await supabase
        .from('token_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setEmployer(employerData);
      setJobs(jobPosts || []);
      setWallet(walletData);

      setOffset(10); // next fetch starts at 10
      setHasMore(jobPosts && jobPosts.length === 10); // if we got full 10, assume more exists
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase, router]);

  // ✅ fetch more jobs
  const loadMoreJobs = async () => {
    if (!user) return;
    setLoadingMore(true);

    try {
      const { data: moreJobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + 29); // next 30

      if (error) {
        console.error('Error loading more jobs:', error);
        return;
      }

      setJobs((prev) => [...prev, ...(moreJobs || [])]);
      setOffset(offset + 30);
      setHasMore(moreJobs && moreJobs.length === 30); // only show button if 30 returned
    } catch (error) {
      console.error('Error loading more jobs:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user) fetchInitial();
  }, [user, fetchInitial]);

  if (!user) return <div className="p-4">Redirecting to login...</div>;
  if (loading) return <div className="p-4">Loading...</div>;

  if (importErrors.length > 0) {
    return (
      <div className="min-h-screen flex items-start p-4 bg-white text-black">
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
        <div className="flex items-center justify-between px-2 lg:px-6 py-4 lg:pt-20 border-b border-gray-200">
          <div className="flex gap-4 items-center">
            <h1 className="text-base lg:text-2xl font-bold">
              Welcome {employer?.name || 'Client'}
            </h1>
          </div>
          <div className="flex gap-4">
            {activeSection !== 'wallet' && <WalletSummary wallet={wallet} />}
            <button
              onClick={() => setActiveSection('post')}
              className="bg-black text-white px-3 py-1.5 text-sm rounded-lg hover:bg-orange-600 transition lg:px-4 lg:py-2 lg:text-base lg:rounded-full"
            >
              Post Job
            </button>
          </div>
        </div>

        {/* content */}
        <div className="px-2 lg:px-6 py-6">
          {activeSection === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="col-span-2 space-y-4 lg:space-y-6">
                <div className="rounded-xl bg-white shadow p-4 lg:p-6">
                  <h2 className="text-xl font-semibold mb-2">Your Jobs</h2>
                  {jobs.length === 0 ? (
                    <p className="text-gray-600">No jobs posted yet.</p>
                  ) : (
                    <>
                      <div className="space-y-2 lg:space-y-4">
                        {jobs.map((j) => (
                          <JobListCard key={j.id} job={j} onEdit={() => setActiveSection('jobs')} />
                        ))}
                      </div>
                      {hasMore && (
                        <div className="flex justify-center mt-4">
                          <button
                            onClick={loadMoreJobs}
                            disabled={loadingMore}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                          >
                            {loadingMore ? 'Loading...' : 'Load More'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-4 lg:space-y-6">
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
              <div className="space-y-2 lg:space-y-4">
                {jobs.map((j) => (
                  <JobListCard key={j.id} job={j} onEdit={() => setActiveSection('post')} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={loadMoreJobs}
                    disabled={loadingMore}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeSection === 'token' && <Wallet wallet={wallet} refreshBalance={fetchInitial} />} {/* ✅ Changed to Wallet */}
          {activeSection === 'profile' && employer && (
            <EmployerProfileEditor employer={employer} onUpdated={fetchInitial} />
          )}
          {activeSection === 'verify' && employer && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Verify Your Identity</h2>
              <Verify employer={employer} />
            </div>
          )}
          {activeSection === 'chats' && <Messages />}
          {activeSection === 'portfolios' && <Portfolio />}
          {activeSection === 'calls' && <VideoCallModal />}
        </div>
      </div>
    </div>
  );
}