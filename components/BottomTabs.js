import { Home, Briefcase, MapPin, User, Plus } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function BottomTabs() {
  const router = useRouter();
  const [dashboardPath, setDashboardPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // ❌ No session at all → send to login
          setDashboardPath('/auth/login');
          setLoading(false);
          return;
        }

        const userId = session.user.id;

        // ✅ Check if employer
        const { data: employer } = await supabase
          .from('employers')
          .select('id')
          .eq('id', userId)
          .single();

        if (employer) {
          setDashboardPath('/dashboard/employer');
          setLoading(false);
          return;
        }

        // ✅ Check if applicant
        const { data: applicant } = await supabase
          .from('applicants')
          .select('id')
          .eq('id', userId)
          .single();

        if (applicant) {
          setDashboardPath('/dashboard/applicant');
          setLoading(false);
          return;
        }

        // ⚠️ Authenticated but no role found → still send to generic dashboard, not login
        setDashboardPath('/dashboard');
      } catch (err) {
        console.error(err);
        setDashboardPath('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  // Only render tabs **after dashboard path is resolved**
  if (loading || !dashboardPath) return null;

  const tabs = [
    { href: '/', label: 'Home', icon: <Home size={22} /> },
    { href: '/profile', label: 'Profile', icon: <User size={22} /> }, // Always /profile
    { href: '/more', label: 'More', icon: <MapPin size={22} /> },
    { href: '/employerlanding', label: 'Post', icon: <Plus size={22} /> },
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
