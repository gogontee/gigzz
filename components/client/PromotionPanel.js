'use client';
import React, { useState, useEffect } from 'react';
import { Megaphone } from 'lucide-react';
import PromoteModal from '../promotion/PromoteModal';
import { supabase } from '../../utils/supabaseClient';

export default function PromotionPanel({ jobs, refresh }) {
  const [showModal, setShowModal] = useState(false);
  const [wallet, setWallet] = useState({ balance: 0 });

  // ✅ State for custom alerts
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  // Function to show alert
  const showAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 4000); // auto-hide after 4s
  };

  // Fetch wallet balance
  const fetchWallet = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) return;

    const userId = session.user.id;

    const { data, error } = await supabase
      .from('token_wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!error && data) setWallet(data);
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handlePromote = async ({ job_id, plan, tokens }) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) return showAlert('Not authenticated', 'error');

    const userId = session.user.id;

    // 1️⃣ Check wallet balance
    if (wallet.balance < tokens) {
      return showAlert('Insufficient tokens for this promotion plan.', 'error');
    }

    // 2️⃣ Check existing promotion
    const { data: job, error: jobFetchError } = await supabase
      .from('jobs')
      .select('promotion_tag, promotion_expires_at')
      .eq('id', job_id)
      .single();

    if (jobFetchError) return showAlert('Failed to fetch job info.', 'error');

    if (job?.promotion_expires_at) {
      const expiresAt = new Date(job.promotion_expires_at);
      const now = new Date();

      if (expiresAt > now) {
        return showAlert(
          `This job is already promoted under the ${job.promotion_tag} plan until ${expiresAt.toLocaleDateString()}.`,
          'error'
        );
      }
    }

    // 3️⃣ Deduct tokens & update wallet
    const { error: walletError } = await supabase
      .from('token_wallets')
      .update({
        balance: wallet.balance - tokens,
        last_action: 'Job promotion',
      })
      .eq('user_id', userId);

    if (walletError) return showAlert('Failed to update wallet.', 'error');

    // 4️⃣ Calculate expiry
    let daysToExpire = plan === 'Silver' ? 3 : plan === 'Gold' ? 7 : 20;
    const expires = new Date();
    expires.setDate(expires.getDate() + daysToExpire);

    // 5️⃣ Update job promotion_tag & expiry
    const { error: jobUpdateError } = await supabase
      .from('jobs')
      .update({
        promotion_tag: plan,
        promotion_expires_at: expires.toISOString(),
      })
      .eq('id', job_id);

    if (jobUpdateError) return showAlert('Failed to update job promotion.', 'error');

    // 6️⃣ Refresh wallet and jobs
    await fetchWallet();
    refresh?.();

    showAlert('🎉 Job promoted successfully!', 'success');
  };

  return (
    <>
      {/* Promotion Card */}
      <div
        onClick={() => setShowModal(true)}
        className="cursor-pointer bg-gradient-to-r from-orange-500 to-black text-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-[1.02] transition-transform"
      >
        <Megaphone className="w-10 h-10 mb-3 text-white" />
        <h3 className="text-lg font-semibold">Promote Your Jobs</h3>
        <p className="text-sm text-white/80 text-center mt-1">
          Boost visibility and reach top creatives faster.
        </p>
        <div className="mt-4 px-4 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition">
          Promote Now
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <PromoteModal
          jobs={jobs}
          userTokens={wallet.balance}
          onPromote={handlePromote}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* ✅ Custom Alert Popup */}
      {alert.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className={`px-6 py-4 rounded-lg shadow-xl text-white text-center max-w-sm transition-all duration-500 ${
              alert.type === 'success'
                ? 'bg-green-600'
                : alert.type === 'error'
                ? 'bg-red-600'
                : 'bg-gray-700'
            }`}
          >
            {alert.message}
          </div>
        </div>
      )}
    </>
  );
}
