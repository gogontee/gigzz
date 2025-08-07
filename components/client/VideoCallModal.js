// components/client/VideoCallModal.js
'use client';
import React from 'react';

export default function VideoCallModal() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Video Call</h2>
        <p className="text-gray-700">Video call UI/integration placeholder.</p>
        <button className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-orange-600">
          Close
        </button>
      </div>
    </div>
  );
}
