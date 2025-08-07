'use client';
import React, { useState } from 'react';
import { Megaphone } from 'lucide-react';
import PromoteModal from '../promotion/PromoteModal';

export default function PromotionPanel({ jobs, wallet, refresh }) {
  const [showModal, setShowModal] = useState(false);

  const handlePromote = async ({ job_id, plan, tokens }) => {
    // Make call to API
    const res = await fetch('/api/promote-job', {
      method: 'POST',
      body: JSON.stringify({ job_id, plan, tokens }),
    });

    const data = await res.json();
    if (data.success) {
      alert('Job promoted!');
      refresh?.();
    } else {
      alert(data.message || 'Failed to promote');
    }
    setShowModal(false);
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
          onClose={() => setShowModal(false)}
          onPromote={handlePromote}
        />
      )}
    </>
  );
}
