'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { supabase } from '../../utils/supabaseClient';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
  { key: 'profile', label: 'My Profile', icon: <User size={18} /> },
  { key: 'portfolio', label: 'Portfolio', icon: <Layers size={18} /> },
  { key: 'applications', label: 'Applications', icon: <Briefcase size={18} /> },
  { key: 'token', label: 'Tokens', icon: <Coins size={18} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

export default function ApplicantLayout({ children, applicant, activeTab, onTabChange }) {
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

  // Desktop hover behavior
  useEffect(() => {
    if (isMobile) return;

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

  // Mobile click toggle
  useEffect(() => {
    if (!isMobile) return;

    const sidebar = sidebarRef.current;
    const handleClick = () => setExpanded((prev) => !prev);

    if (sidebar) sidebar.addEventListener('click', handleClick);
    return () => {
      if (sidebar) sidebar.removeEventListener('click', handleClick);
    };
  }, [isMobile]);

  const handleNavClick = (item) => {
    if (item.href) {
      router.push(item.href);
    } else if (onTabChange) {
      onTabChange(item.key);
    }

    if (isMobile) setExpanded(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={`relative flex flex-col bg-black text-white transition-all duration-300 shadow-lg ${
            expanded ? 'w-64' : 'w-16'
          } min-h-screen`}
        >
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
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item)}
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
                  if (isMobile) setExpanded(false);
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
        <main className="flex-1 bg-white flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {/* Sticky Bottom Tabs for Mobile */}
          {isMobile && (
            <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around py-2 z-50">
              {navItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item)}
                    className={`flex flex-col items-center text-xs ${
                      isActive ? 'text-orange-600 font-semibold' : 'text-gray-500'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
