import Link from 'next/link';
import { Home, Briefcase, MapPin, User, Plus } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient'; // adjust if needed

export default function BottomTabs() {
  const router = useRouter();
  const [profilePath, setProfilePath] = useState('/auth/login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setProfilePath('/auth/login');
          setLoading(false);
          return;
        }

        const userId = session.user.id;

        // Check employer
        const { data: employer } = await supabase
          .from('employers')
          .select('id')
          .eq('id', userId)
          .single();

        if (employer) {
          setProfilePath('/dashboard/employer');
          setLoading(false);
          return;
        }

        // Check applicant
        const { data: applicant } = await supabase
          .from('applicants')
          .select('id')
          .eq('id', userId)
          .single();

        if (applicant) {
          setProfilePath('/dashboard/applicant');
          setLoading(false);
          return;
        }

        // Fallback if no role found
        setProfilePath('/auth/login');
      } catch (err) {
        console.error('Error fetching user role:', err);
        setProfilePath('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const tabs = [
    { href: '/', label: 'Home', icon: <Home size={22} /> },
    { href: '/profile', label: 'Profile', icon: <User size={22} /> },
    { href: '/more', label: 'More', icon: <MapPin size={22} /> },
    { href: '/employerlanding', label: 'Post', icon: <Plus size={22} /> },
    { href: profilePath, label: 'Dashboard', icon: <Briefcase size={22} /> },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-black border-t border-gray-800 flex justify-around py-2 md:hidden z-50">
      {tabs.map((tab) => (
        <Link
          href={tab.href}
          key={tab.href}
          className="flex flex-col items-center text-xs text-white group"
        >
          <div
            className={`${
              router.pathname === tab.href ? 'text-orange-500' : 'text-white'
            } group-hover:text-orange-500`}
          >
            {tab.icon}
          </div>
          <span className="text-[10px] group-hover:text-orange-500">
            {tab.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
