'use client';
import React from 'react';
import { Eye } from 'lucide-react';

export default function PortfolioBrowser({ portfolios, onView }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {portfolios.slice(0, 9).map((p) => (
        <div
          key={p.id}
          className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden group cursor-pointer"
          onClick={() => onView(p)}
        >
          {p.cover_image ? (
            <img
              src={p.cover_image}
              alt={p.title}
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
          <div className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold truncate">{p.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-1">{p.description}</p>
            </div>
            <Eye className="w-5 h-5 text-gray-500 hover:text-orange-600 transition" />
          </div>
        </div>
      ))}
    </div>
  );
}
