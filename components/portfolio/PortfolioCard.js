'use client';
import React from 'react';
import { useRouter } from 'next/router';
import { Eye } from 'lucide-react';

export default function PortfolioCard({ projectData }) {
  const router = useRouter();

  if (!projectData) return null;

  // Truncate description to first 15 words
  const description = projectData.details
    ? projectData.details.split(' ').slice(0, 15).join(' ') + (projectData.details.split(' ').length > 15 ? '...' : '')
    : '';

  const handleView = (e) => {
    e.stopPropagation(); // Prevents triggering any parent onClick
    router.push(`/project/${projectData.id}`);
  };

  return (
    <div
      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition relative cursor-pointer"
      onClick={handleView} // Optional: clicking anywhere navigates
    >
      {/* Banner */}
      <div className="w-full h-40 bg-gray-100 overflow-hidden">
        {projectData.profile ? (
          <img
            src={projectData.profile}
            alt={projectData.title || 'Project Banner'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No banner
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold mb-1 truncate">{projectData.title}</h2>
            <p className="text-sm text-gray-600">{description}</p>
          </div>

          {/* Eye icon as button */}
          <button
            onClick={handleView}
            className="text-xs flex items-center gap-1 border px-2 py-1 rounded-md hover:bg-gray-50"
            title="View Details"
          >
            <Eye size={14} /> View
          </button>
        </div>
      </div>
    </div>
  );
}
