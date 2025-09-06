'use client';
import React, { useState, useEffect } from 'react';
import { Megaphone } from 'lucide-react';
import PromoteModal from '../promotion/PromoteModal';
import { supabase } from '../../utils/supabaseClient';

export default function PromotionPanel({ jobs, refresh }) {
  const [showModal, setShowModal] = useState(false);
  const [wallet, setWallet] = useState({ balance: 0 });

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
    if (sessionError || !session) return alert('Not authenticated');

    const userId = session.user.id;

    // 1️⃣ Check wallet balance
    if (wallet.balance < tokens) {
      return alert('Insufficient tokens for this promotion plan.');
    }

    // 2️⃣ Check existing promotion
    const { data: job, error: jobFetchError } = await supabase
      .from('jobs')
      .select('promotion_tag, promotion_expires_at')
      .eq('id', job_id)
      .single();

    if (jobFetchError) return alert('Failed to fetch job info.');

    if (job?.promotion_expires_at) {
  const expiresAt = new Date(job.promotion_expires_at);
  const now = new Date();

  if (expiresAt > now) {
    return alert(`This job is already promoted under the ${job.promotion_tag} plan until ${expiresAt.toLocaleDateString()}.`);
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

    if (walletError) return alert('Failed to update wallet.');

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

    if (jobUpdateError) return alert('Failed to update job promotion.');

    // 6️⃣ Refresh wallet and jobs
    await fetchWallet();
    refresh?.();

    alert('Job promoted successfully!');
  };

  return (
    <>
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

      {showModal && (
        <PromoteModal
          jobs={jobs}
          userTokens={wallet.balance}
          onPromote={handlePromote}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
