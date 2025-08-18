'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Briefcase,
  PlusCircle,
  Wallet,
  Grid,
  MessageCircle,
  Video,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const items = [
  { key: 'overview', label: 'Overview', icon: <Grid size={18} /> },
  { key: 'post', label: 'Post Job', icon: <PlusCircle size={18} /> },
  { key: 'jobs', label: 'My Jobs', icon: <Briefcase size={18} /> },
  { key: 'wallet', label: 'Wallet / Promotions', icon: <Wallet size={18} /> },
  { key: 'portfolios', label: 'Portfolios', icon: <User size={18} /> },
  { key: 'chats', label: 'Chats', icon: <MessageCircle size={18} /> },
  { key: 'calls', label: 'Video Calls', icon: <Video size={18} /> },
  { key: 'profile', label: 'Profile', icon: <Settings size={18} /> },
  { key: 'verify', label: 'Verification', icon: <ShieldCheck size={18} />, path: '/verification' },
];

export default function ClientSidebar({ active, onChange, employer }) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);

  // 👤 Fetch avatar from employers.avatar_url
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    if (employer?.avatar_url) {
      setAvatarUrl(employer.avatar_url);
    } else {
      setAvatarUrl(null);
    }
  }, [employer?.avatar_url]);

  // 🖱 Hover handlers (desktop)
  const handleMouseEnter = () => setExpanded(true);
  const handleMouseLeave = () => setExpanded(false);

  // 📱 Mobile: fold after button click
  const handleItemClick = (key) => {
    onChange(key);
    setExpanded(false); // fold after click
  };

  return (
    <aside
      ref={containerRef}
      className={`relative flex flex-col bg-black text-white transition-all duration-300 shadow-lg ${
        expanded ? 'w-64' : 'w-16'
      } min-h-screen`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Toggle (optional) */}
      <div className="absolute top-4 right-[-12px] z-10 flex items-center">
        <button
          onClick={() => setExpanded((e) => !e)}
          aria-label="Toggle sidebar"
          className="bg-white/10 p-1 rounded-full hover:bg-white/20 transition"
        >
          {expanded ? (
            <ChevronLeft size={18} className="text-white" />
          ) : (
            <ChevronRight size={18} className="text-white" />
          )}
        </button>
      </div>

      {/* Header */}
      <div className="px-4 py-5 border-b border-gray-800 flex items-center gap-3">
        <div
          className={`text-xl font-bold transition-all ${
            expanded ? '' : 'opacity-0 w-0'
          }`}
        >
          Gigzz
        </div>
        {expanded && (
          <div className="flex-1 text-sm opacity-80">Client Dashboard</div>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-1">
        {items.map((it) => {
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => handleItemClick(it.key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                isActive ? 'bg-orange-500 text-white' : 'text-white'
              } hover:bg-orange-600 focus:outline-none`}
            >
              <div className="flex-shrink-0">{it.icon}</div>
              <div
                className={`flex-1 text-sm font-medium truncate ${
                  !expanded ? 'hidden' : ''
                }`}
              >
                {it.label}
              </div>
              {isActive && expanded && (
                <div className="w-2 h-2 bg-orange-300 rounded-full ml-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-800">
        {employer && (
          <div className="flex items-center gap-3 mb-3">
            {/* Avatar from employers.avatar_url */}
            <div className="relative group">
              <img
                src={avatarUrl || '/placeholder-user.png'}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover border-2 border-white"
              />
            </div>

            {expanded && (
              <div className="flex flex-col text-xs">
                <div className="font-semibold">{employer.name || 'Client'}</div>
                <div className="opacity-70">Employer</div>
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => {
            window.location.href = '/auth/login';
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-white/10 transition"
        >
          <LogOut size={16} />
          {expanded && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
