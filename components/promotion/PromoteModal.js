'use client';
import React, { useState } from 'react';

const plans = [
  { name: 'Silver', cost: 5, color: 'bg-gray-300', badge: '🥈' },
  { name: 'Gold', cost: 10, color: 'bg-yellow-400', badge: '🥇' },
  { name: 'Premium', cost: 20, color: 'bg-orange-600', badge: '🏆' },
];

export default function PromoteModal({ jobs, onPromote, onClose, userTokens = 0 }) {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePromotion = async () => {
    if (!selectedJobId || !selectedPlan) return;

    if (userTokens < selectedPlan.cost) {
      setError('Insufficient tokens for this promotion plan.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onPromote({
        job_id: selectedJobId,
        plan: selectedPlan.name.toLowerCase(),
        tokens: selectedPlan.cost,
      });
      onClose(); // Close modal after successful promotion
    } catch (err) {
      setError('Failed to promote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Promote a Job</h2>

        <select
          onChange={(e) => setSelectedJobId(e.target.value)}
          value={selectedJobId}
          className="w-full mb-4 p-2 border rounded"
        >
          <option value="">Select Job</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {plans.map((plan) => (
            <button
              key={plan.name}
              onClick={() => {
                setSelectedPlan(plan);
                setError('');
              }}
              className={`rounded py-2 px-3 text-white font-semibold flex flex-col items-center justify-center ${plan.color} ${
                selectedPlan?.name === plan.name ? 'ring-2 ring-black' : ''
              }`}
            >
              <span>{plan.badge}</span>
              <span>{plan.name}</span>
              <span className="text-sm">{plan.cost} tokens</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-2 text-center">{error}</div>
        )}

        <button
          disabled={!selectedJobId || !selectedPlan || isSubmitting}
          onClick={handlePromotion}
          className="bg-black text-white w-full py-2 rounded hover:bg-gray-900 transition disabled:opacity-50"
        >
          {isSubmitting
            ? 'Processing...'
            : `Promote Now (${selectedPlan?.cost || '-'} tokens)`}
        </button>

        <button
          onClick={onClose}
          className="mt-3 text-sm text-gray-500 underline w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
