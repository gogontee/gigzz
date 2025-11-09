// components/client/WalletSummary.js
'use client';
import React from 'react';
export default function WalletSummary({ wallet }) {
  return <div className="px-3 py-1 bg-gray-100 rounded">Balance: {wallet?.balance ?? 0}</div>;
}
