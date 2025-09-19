'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';

export default function ProfilePromotion({ profile, refreshProfile }) {
  const [promotionOpen, setPromotionOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, type: '', message: '', callback: null });

  const promotionPlans = {
    premium: { cost: 10, days: 30, label: 'Premium' },
    gold: { cost: 5, days: 10, label: 'Gold' },
    silver: { cost: 3, days: 3, label: 'Silver' },
  };

  // Helper to show a modal
  const showModal = (type, message, callback) => {
    setModal({ show: true, type, message, callback });
  };

  const closeModal = () => setModal({ show: false, type: '', message: '', callback: null });

  const handlePromotion = async (type) => {
    if (!profile?.id) return;
    const plan = promotionPlans[type];
    if (!plan) return;

    // 1️⃣ Deduction confirmation modal
    showModal(
      'confirm',
      `This promotion will deduct ${plan.cost} token(s) from your wallet. Do you want to continue?`,
      async () => {
        closeModal();
        await executePromotion(plan);
      }
    );
  };

  const executePromotion = async (plan) => {
    setLoading(true);
    try {
      // Fetch wallet
      const { data: walletData, error: walletErr } = await supabase
        .from('token_wallets')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (walletErr) throw walletErr;
      if (walletData.balance < plan.cost) {
        showModal('info', 'Insufficient tokens!');
        setLoading(false);
        return;
      }

      // Check existing promotion
      const now = new Date();
      let currentExpiry = profile.token_expiry ? new Date(profile.token_expiry) : now;
      if (currentExpiry > now) {
        showModal(
          'confirm',
          `Your profile is already promoted until ${currentExpiry.toDateString()}. Do you want to upgrade/extend it?`,
          async () => {
            closeModal();
            await processPromotion(walletData, plan, currentExpiry);
          }
        );
        setLoading(false);
        return;
      }

      await processPromotion(walletData, plan, currentExpiry);
    } catch (err) {
      console.error(err);
      showModal('info', 'Promotion failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processPromotion = async (walletData, plan, currentExpiry) => {
    try {
      // Deduct tokens & update last action
      const newBalance = walletData.balance - plan.cost;
      await supabase
        .from('token_wallets')
        .update({
          balance: newBalance,
          last_action: `Profile promotion, ${plan.label.toLowerCase()}`,
        })
        .eq('user_id', profile.id);

      // Extend expiry
      const now = new Date();
      if (currentExpiry < now) currentExpiry = now; // reset if expired
      currentExpiry.setDate(currentExpiry.getDate() + plan.days);

      // Update applicants table
      await supabase
        .from('applicants')
        .update({
          token: (profile.token || 0) + plan.cost,
          token_expiry: currentExpiry.toISOString(),
        })
        .eq('id', profile.id);

      showModal('info', `Profile promoted with ${plan.label} plan!`);
      setPromotionOpen(false);

      // Refresh parent profile
      refreshProfile?.();
    } catch (err) {
      console.error(err);
      showModal('info', 'Promotion failed. Please try again.');
    }
  };

  return (
    <>
      <button
        onClick={() => setPromotionOpen(true)}
        className="mt-6 px-6 py-3 bg-orange-500 text-white rounded-xl shadow hover:bg-orange-600 transition"
      >
        Promote Profile
      </button>

      {promotionOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-80"
          >
            <h3 className="text-lg font-semibold mb-4">Choose Promotion Plan</h3>
            <div className="flex flex-col gap-4">
              {Object.keys(promotionPlans).map((key) => {
                const plan = promotionPlans[key];
                return (
                  <button
                    key={key}
                    onClick={() => handlePromotion(key)}
                    disabled={loading}
                    className={`py-2 rounded-xl text-white transition disabled:opacity-50 ${
                      key === 'premium'
                        ? 'bg-orange-500 hover:bg-orange-600'
                        : key === 'gold'
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-gray-400 hover:bg-gray-500'
                    }`}
                  >
                    {plan.label} - {plan.cost} Tokens / {plan.days} Days
                  </button>
                );
              })}
              <button
                onClick={() => setPromotionOpen(false)}
                className="mt-2 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Custom modal alerts */}
      <AnimatePresence>
        {modal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-xl p-6 w-80 text-center shadow-xl"
            >
              <p className="text-gray-900 mb-4">{modal.message}</p>
              {modal.type === 'confirm' ? (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      modal.callback?.();
                      closeModal();
                    }}
                    className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition"
                  >
                    Yes
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition"
                >
                  OK
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
