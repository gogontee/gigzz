'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import {
  Briefcase,
  PlusCircle,
  Wallet,
  Grid,
  MessageCircle,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Crown, // Added Crown icon for director
} from 'lucide-react';
import useUnreadMessages from '../../hooks/useUnreadMessages';

export const supabase = createPagesBrowserClient();

const items = [
  { key: 'overview', label: 'Overview', icon: <Grid size={18} /> },
  { key: 'post', label: 'Post Job', icon: <PlusCircle size={18} /> },
  { key: 'jobs', label: 'My Jobs', icon: <Briefcase size={18} /> },
  { key: 'token', label: 'Wallet', icon: <Wallet size={18} /> },
  { key: 'portfolios', label: 'Portfolios', icon: <User size={18} /> },
  { key: 'chats', label: 'Chats', icon: <MessageCircle size={18} /> },
  { key: 'profile', label: 'Profile', icon: <Settings size={18} /> },
  {
    key: 'verify',
    label: 'Verification',
    icon: <ShieldCheck size={18} />,
    path: '/verification',
  },
];

export default function ClientSidebar({ active, onChange, employer }) {
  const [expanded, setExpanded] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDirector, setIsDirector] = useState(false); // New state for director status

  // ✅ unread count from hook
  const unreadCount = useUnreadMessages();

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (employer?.avatar_url) setAvatarUrl(employer.avatar_url);
    else setAvatarUrl(null);
  }, [employer?.avatar_url]);

  // Check if user is a director
  useEffect(() => {
    const checkDirectorStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('directors')
            .select('user_id')
            .eq('user_id', user.id)
            .single();

          if (data && !error) {
            setIsDirector(true);
          }
        }
      } catch (error) {
        console.error('Error checking director status:', error);
      }
    };

    checkDirectorStatus();
  }, []);

  const handleMouseEnter = () => !isMobile && setExpanded(true);
  const handleMouseLeave = () => !isMobile && setExpanded(false);

  const handleNavClick = (key) => {
    onChange(key);
    if (isMobile) setExpanded(false); // auto-collapse on mobile
  };

  const handleLinkClick = () => {
    if (isMobile) setExpanded(false); // auto-collapse on mobile
  };

  return (
    <aside
      className={`relative flex flex-col bg-black text-white transition-all duration-300 shadow-lg
        ${expanded ? 'w-64' : 'w-16'} min-h-screen`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Toggle Button */}
      <div className="absolute top-2 right-[-12px] flex items-center z-10">
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
      <div className="px-2 lg:px-3 py-3 border-b border-gray-800 flex items-center gap-2 sticky top-0 bg-black z-0">
        <div
          className={`text-xl font-bold transition-all ${
            expanded ? '' : 'opacity-0 w-0'
          }`}
        >
          Gigzz
        </div>
        {expanded && <div className="flex-1 text-sm opacity-80">Client Dashboard</div>}
      </div>

      {/* Nav Items */}
      <div className="flex flex-col px-1 lg:px-2 py-2 space-y-1 sticky top-0">
        {items.map((it) => {
          const isActive = active === it.key;
          const isChats = it.key === 'chats';

          const content = (
            <div
              className={`w-full flex items-center gap-3 px-2 lg:px-3 py-1.5 rounded-lg text-left transition
                ${isActive ? 'bg-orange-500 text-white' : 'text-white'} hover:bg-orange-600`}
            >
              <div className="flex-shrink-0 relative">
                {it.icon}
                {/* ✅ show unread badge on Chats */}
                {isChats && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
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
            </div>
          );

          return it.path ? (
            <Link key={it.key} href={it.path} onClick={handleLinkClick}>
              {content}
            </Link>
          ) : (
            <button key={it.key} onClick={() => handleNavClick(it.key)}>
              {content}
            </button>
          );
        })}

        {/* Footer */}
        <div className="mt-3 px-2 lg:px-3 py-3 border-t border-gray-800 flex flex-col gap-2">
          {employer && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src={avatarUrl || '/placeholder-user.png'}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-white"
                />
                {/* Director Icon */}
                {isDirector && (
                  <Link 
                    href="/admin/dashboard" 
                    onClick={handleLinkClick}
                    className="absolute -top-1 -right-1 bg-purple-600 p-0.5 rounded-full border-2 border-white hover:bg-purple-700 transition"
                    title="Director Dashboard"
                  >
                    <Crown size={12} className="text-white" />
                  </Link>
                )}
              </div>
              {expanded && (
                <div className="flex flex-col text-xs">
                  <div className="font-semibold">{employer.name || 'Client'}</div>
                  <div className="opacity-70">Employer</div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              supabase.auth.signOut();
              window.location.href = '/auth/login';
              if (isMobile) setExpanded(false);
            }}
            className="w-full flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-md text-sm hover:bg-white/10 transition"
          >
            <LogOut size={16} />
            {expanded && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}