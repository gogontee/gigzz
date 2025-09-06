'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../utils/supabaseClient'; // ✅ fixed path
import ApplicantLayout from '../../../components/dashboard/ApplicantLayout';
import Portfolio from '../../../components/portfolio/Portfolio';
import Profile from '../../../components/Profile';
import Application from '../../../components/Application'; 
import Settings from '../../../components/Settings';
import Token from '../../../components/Token'; // ✅ new import
import {
  Briefcase,
  Coins,
  Layers,
  Bell,
  MessageSquare,
  Pencil,
} from 'lucide-react';

export default function ApplicantDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const fileInputRef = useRef(null);

  // Fetch profile and stats
  useEffect(() => {
    const fetchData = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) return;

      const userId = userData.user.id;

      const { data: profileData } = await supabase
        .from('applicants')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: tokenData } = await supabase
        .from('token_wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const { count: applicationsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('applicant_id', userId);

      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setProfile(profileData);
      setTokens(tokenData?.balance || 0);
      setApplicationsCount(applicationsCount || 0);
      setProjectsCount(projectsCount || 0);
    };

    fetchData();
  }, []);

  // Fetch notifications count
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${userData.user.id},user_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else {
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    };

    fetchNotifications();
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !profile?.id) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Upload failed:', uploadError.message);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('applicants')
      .update({ avatar_url: data.publicUrl })
      .eq('id', profile.id);

    if (!updateError) {
      setProfile((prev) => ({
        ...prev,
        avatar_url: data.publicUrl,
      }));
    }
  };

  return (
    <ApplicantLayout
      applicant={profile}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* Dashboard tab */}
      {activeTab === 'dashboard' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 md:pt-20 relative"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-semibold">
                Welcome back, {profile?.full_name || 'Creative'}
              </h2>
              <p className="text-sm text-gray-500">
                Let's start making money today!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a href="/messages" title="Messages">
                <MessageSquare className="w-6 h-6 text-gray-700 hover:text-orange-600" />
              </a>
              <a
                href="/dashboard/applicant/notifications"
                title="Notifications"
                className="relative"
              >
                <Bell className="w-6 h-6 text-gray-700 hover:text-orange-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </a>

              <div className="relative group">
                <img
                  src={profile?.avatar_url || '/default-avatar.png'}
                  alt="Avatar"
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border-2 border-orange-500 object-cover"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow group-hover:flex hidden md:group-hover:flex md:flex hover:bg-orange-100"
                >
                  <Pencil size={14} className="text-gray-700" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={<Coins className="text-orange-500" />}
              label="Token Balance"
              value={tokens}
            />
            <StatCard
              icon={<Briefcase className="text-orange-500" />}
              label="Applications"
              value={applicationsCount}
            />
            <StatCard
              icon={<Layers className="text-orange-500" />}
              label="Portfolios"
              value={projectsCount}
            />
          </div>
        </motion.div>
      )}

      {/* Portfolio tab */}
      {activeTab === 'portfolio' && <Portfolio />}

      {/* Profile tab */}
      {activeTab === 'profile' && profile && <Profile userId={profile.id} />}

      {/* Applications tab */}
      {activeTab === 'applications' && <Application />}

      {/* Settings tab */}
      {activeTab === 'settings' && <Settings />}

      {/* Token tab */}
      {activeTab === 'token' && <Token balance={tokens} />} {/* ✅ pass tokens */}
    </ApplicantLayout>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 bg-gray-100 p-4 rounded-xl shadow-sm">
      <div className="p-2 bg-white rounded-full shadow">{icon}</div>
      <div>
        <p className="text-gray-600 text-sm">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}
