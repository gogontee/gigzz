// components/client/ChatSidebar.js
'use client';
import React from 'react';
export default function ChatSidebar({ employer }) {
  return <div className="p-4 border rounded">Chat sidebar for {employer?.name || '...'} </div>;
}
