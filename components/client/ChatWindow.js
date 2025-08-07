'use client';

import React from 'react';

export default function Window({ title, children }) {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-4xl mx-auto my-8">
      {title && (
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {title}
        </h2>
      )}
      <div>{children}</div>
    </div>
  );
}
