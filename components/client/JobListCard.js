'use client';
import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export default function JobListCard({ job, onEdit, onDelete }) {
  return (
    <div className="rounded-xl bg-white shadow-md border p-4 flex flex-col gap-2 hover:shadow-lg transition h-full">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-black">{job?.title || 'Untitled Job'}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {job?.category || 'Uncategorized'} • {job?.type || 'Type N/A'}
          </p>
        </div>
        {job?.is_promoted && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
            Promoted • {job.promoted_plan?.charAt(0).toUpperCase() + job.promoted_plan?.slice(1)}
          </span>
        )}
      </div>

      <div className="text-sm text-gray-700 line-clamp-2">
        {job?.description || 'No job description available.'}
      </div>

      <div className="text-sm text-gray-500">
        ₦{job?.min_price?.toLocaleString()} - ₦{job?.max_price?.toLocaleString()} ({job?.price_frequency || 'one-time'})
      </div>

      <div className="flex justify-end gap-3 pt-2 mt-auto">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <Pencil size={16} />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}
