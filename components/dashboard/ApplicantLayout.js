'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import {
  LogOut,
  Briefcase,
  Layers,
  Settings,
  Home,
  Coins,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard/applicant', icon: <Home size={18} /> },
  { key: 'profile', label: 'My Profile', href: '/profile', icon: <User size={18} /> },
  { key: 'portfolio', label: 'Portfolio', href: '/dashboard/applicant/portfolio', icon: <Layers size={18} /> },
  { key: 'applications', label: 'Applications', href: '/dashboard/applicant/applications', icon: <Briefcase size={18} /> },
  { key: 'tokens', label: 'Tokens', href: '/dashboard/applicant/tokens', icon: <Coins size={18} /> },
  { key: 'settings', label: 'Settings', href: '/dashboard/applicant/settings', icon: <Settings size={18} /> },
];

export default function ApplicantLayout({ children, applicant }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef(null);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Desktop hover behavior only
  useEffect(() => {
    if (isMobile) return; // skip on mobile

    const sidebar = sidebarRef.current;
    const handleMouseEnter = () => setExpanded(true);
    const handleMouseLeave = () => setExpanded(false);

    if (sidebar) {
      sidebar.addEventListener('mouseenter', handleMouseEnter);
      sidebar.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (sidebar) {
        sidebar.removeEventListener('mouseenter', handleMouseEnter);
        sidebar.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [isMobile]);

  // Mobile: toggle expand/collapse on click anywhere inside sidebar
  useEffect(() => {
    if (!isMobile) return;

    const sidebar = sidebarRef.current;
    const handleClick = () => {
      setExpanded((prev) => !prev); // toggle open/close
    };

    if (sidebar) {
      sidebar.addEventListener('click', handleClick);
    }

    return () => {
      if (sidebar) {
        sidebar.removeEventListener('click', handleClick);
      }
    };
  }, [isMobile]);

  const handleNavClick = (href) => {
    router.push(href);
    if (isMobile) {
      setExpanded(false); // auto-fold after nav on mobile
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`relative flex flex-col bg-black text-white transition-all duration-300 shadow-lg ${
          expanded ? 'w-64' : 'w-16'
        } min-h-screen`}
      >
        {/* Toggle Button (desktop only) */}
        {!isMobile && (
          <div className="absolute top-4 right-[-12px] flex items-center z-10">
            <button
              onClick={() => setExpanded((e) => !e)}
              aria-label="Toggle sidebar"
              className="bg-white/10 p-1 rounded-full hover:bg-white/20 transition"
            >
              {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        )}

        {/* Header */}
        <div className="px-4 py-5 border-b border-gray-800 flex items-center gap-3 sticky top-0 bg-black z-0">
          <div className={`text-xl font-bold transition-all ${expanded ? '' : 'opacity-0 w-0'}`}>
            Gigzz
          </div>
          {expanded && <div className="flex-1 text-sm opacity-80">Creative Dashboard</div>}
        </div>

        {/* Nav Items */}
        <div className="flex flex-col px-1 py-4 space-y-1 sticky top-0">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                  isActive ? 'bg-orange-500 text-white' : 'text-white'
                } hover:bg-orange-600 focus:outline-none`}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                <div className={`flex-1 text-sm font-medium truncate ${!expanded ? 'hidden' : ''}`}>
                  {item.label}
                </div>
                {isActive && expanded && <div className="w-2 h-2 bg-orange-300 rounded-full ml-1" />}
              </button>
            );
          })}

          {/* Footer: Avatar + Logout */}
          <div className="mt-4 px-3 py-4 border-t border-gray-800 flex flex-col gap-3">
            {applicant && (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={applicant.avatar_url || '/placeholder-user.png'}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover border-2 border-white"
                  />
                </div>
                {expanded && (
                  <div className="flex flex-col text-xs">
                    <div className="font-semibold">{applicant.full_name || 'Creative'}</div>
                    <div className="opacity-70">Creative</div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/auth/login');
                if (isMobile) setExpanded(false); // fold after logout on mobile
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-white/10 transition"
            >
              <LogOut size={16} />
              {expanded && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-white">{children}</main>
    </div>
  );
}
