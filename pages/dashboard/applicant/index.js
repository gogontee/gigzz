import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import ApplicantLayout from '../../../components/dashboard/ApplicantLayout';
import MobileHeader from '../../../components/MobileHeader';
import {
  Briefcase,
  Coins,
  Layers,
  Bell,
  MessageSquare,
  Pencil,
} from 'lucide-react';

export default function ApplicantDashboard() {
  const [profile, setProfile] = useState(null);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const fileInputRef = useRef(null);

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

      const popupSeen = localStorage.getItem('profilePopupSeen');
      if (!popupSeen && profileData) {
        setShowPopup(true);
        localStorage.setItem('profilePopupSeen', 'true');
      }
    };

    fetchData();
  }, []);

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
        setNotifications(data);
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
    <ApplicantLayout>
      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileHeader />
      </div>

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
              Let' start making money today!
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

        {/* Quick Actions */}
        <div className="relative">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>

          {/* Mobile: all buttons inline scroll */}
          <div className="flex gap-3 overflow-x-auto md:hidden pb-2">
            <ActionButton href="/dashboard/applicant/edit" label="Edit" />
            <ActionButton href="/dashboard/applicant/portfolio" label="Portfolio" />
            <ActionButton href="/dashboard/applicant/tokens" label="Tokens" />
            <ActionButton href="/dashboard/applicant/applications" label="Apps" />
          </div>

          {/* Popup still shows on Edit button */}
          {showPopup && (
            <div className="absolute -top-20 left-10 bg-white shadow-lg rounded-lg p-3 w-56 text-xs text-gray-700 z-50 md:hidden">
              <div className="absolute bottom-[-6px] left-8 w-3 h-3 bg-white rotate-45 shadow-md"></div>
              👋 Please click here to update your profile before creating a portfolio.
              <button
                onClick={() => setShowPopup(false)}
                className="block mt-2 text-xs text-orange-600 font-medium hover:underline"
              >
                Got it
              </button>
            </div>
          )}

          {/* Desktop: original flex-wrap */}
          <div className="hidden md:flex flex-wrap gap-4">
            <div className="relative inline-block">
              <ActionButton href="/dashboard/applicant/edit" label="Edit Profile" />
              {showPopup && (
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-lg p-3 w-64 text-sm text-gray-700 z-50">
                  <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 shadow-md"></div>
                  👋 Please click here to update your profile before creating a portfolio.
                  <button
                    onClick={() => setShowPopup(false)}
                    className="block mt-2 text-xs text-orange-600 font-medium hover:underline"
                  >
                    Got it
                  </button>
                </div>
              )}
            </div>
            <ActionButton href="/dashboard/applicant/portfolio" label="Manage Portfolio" />
            <ActionButton href="/dashboard/applicant/tokens" label="Buy Tokens" />
            <ActionButton href="/dashboard/applicant/applications" label="View Applications" />
          </div>
        </div>
      </motion.div>
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

function ActionButton({ href, label }) {
  return (
    <a
      href={href}
      className="bg-black text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition whitespace-nowrap flex-shrink-0"
    >
      {label}
    </a>
  );
}
