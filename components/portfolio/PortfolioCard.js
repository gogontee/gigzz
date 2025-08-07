// components/portfolio/PortfolioCard.js
'use client';
import React from 'react';
import { ExternalLink, Edit3, Trash2, Eye } from 'lucide-react';

export default function PortfolioCard({
  portfolio,
  onEdit,
  onDelete,
  onView,
  isOwner = false,
}) {
  return (
    <div
      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition relative"
    >
      {/* Cover */}
      <div className="w-full h-40 bg-gray-100 overflow-hidden">
        {portfolio.cover_image ? (
          <img
            src={portfolio.cover_image}
            alt={portfolio.title || 'Portfolio cover'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No cover image
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold mb-1 truncate">{portfolio.title}</h2>
            <p className="text-sm text-gray-600 line-clamp-2">{portfolio.description}</p>
          </div>
          {isOwner && (
            <div className="flex flex-col items-end gap-1 ml-2">
              <div className="flex gap-1">
                {onView && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(portfolio);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 rounded-md hover:bg-gray-200"
                    title="View Portfolio"
                  >
                    <Eye size={14} /> View
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(portfolio);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 rounded-md hover:bg-orange-200"
                    title="Edit Portfolio"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                )}
              </div>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(portfolio.id);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800"
                  title="Delete Portfolio"
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {portfolio.tags && Array.isArray(portfolio.tags) && portfolio.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {portfolio.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {portfolio.tags.length > 5 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                +{portfolio.tags.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Links */}
        <div className="mt-auto flex justify-between items-center pt-2">
          <div className="flex gap-3 flex-wrap">
            {portfolio.live_link && (
              <a
                href={portfolio.live_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center text-sm font-medium text-orange-600 hover:underline"
              >
                Live <ExternalLink size={14} className="ml-1" />
              </a>
            )}
            {portfolio.repo_link && (
              <a
                href={portfolio.repo_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:underline"
              >
                Code <ExternalLink size={14} className="ml-1" />
              </a>
            )}
          </div>
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(portfolio);
              }}
              className="text-xs flex items-center gap-1 border px-2 py-1 rounded-md hover:bg-gray-50"
              title="View Details"
            >
              <Eye size={14} /> Details
            </button>
          )}
        </div>
      </div>

      {/* Badge */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-full px-2 py-1 text-xs font-medium shadow">
        {portfolio.is_public ? 'Public' : 'Private'}
      </div>
    </div>
  );
}
