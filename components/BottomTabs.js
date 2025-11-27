import { Home, Briefcase, MapPin, User, Plus } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

export default function BottomTabs() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();

  const [dashboardPath, setDashboardPath] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        if (!user) {
          // Not logged in → login page
          setDashboardPath('/auth/login');
          setRole(null);
          return;
        }

        const userId = user.id;

        // Check employer
        const { data: employer } = await supabase
          .from('employers')
          .select('id')
          .eq('id', userId)
          .single();

        if (employer) {
          setDashboardPath('/dashboard/employer');
          setRole('employer');
          return;
        }

        // Check applicant
        const { data: applicant } = await supabase
          .from('applicants')
          .select('id')
          .eq('id', userId)
          .single();

        if (applicant) {
          setDashboardPath('/dashboard/applicant');
          setRole('applicant');
          return;
        }

        // Authenticated but no role found → fallback to login
        setDashboardPath('/auth/login');
        setRole(null);
      } catch (err) {
        console.error('Error fetching role:', err);
        setDashboardPath('/auth/login');
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user, supabase]);

  if (loading || !dashboardPath) return null;

  const tabs = [
    { href: '/', label: 'Home', icon: <Home size={22} /> },
    { href: '/profile', label: 'Profile', icon: <User size={22} /> },
    { href: '/more', label: 'More', icon: <MapPin size={22} /> },
    // Post tab - only visible to employers
    ...(role === 'employer' ? [{ href: '/employerlanding', label: 'Post', icon: <Plus size={22} /> }] : []),
    { href: dashboardPath, label: 'Dashboard', icon: <Briefcase size={22} /> },
  ];

  const handleTabClick = (href) => {
    if (!href || router.pathname === href) return;
    router.push(href);
  };

  return (
    <div className="fixed bottom-0 w-full bg-black border-t border-gray-800 flex justify-around py-2 md:hidden z-50">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          onClick={() => handleTabClick(tab.href)}
          className="flex flex-col items-center text-xs text-white group"
        >
          <div
            className={`${
              router.pathname === tab.href ? 'text-orange-500' : 'text-white'
            } group-hover:text-orange-500`}
          >
            {tab.icon}
          </div>
          <span className="text-[10px] group-hover:text-orange-500">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}