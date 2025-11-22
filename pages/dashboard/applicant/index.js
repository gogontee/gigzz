'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../utils/supabaseClient';
import ApplicantLayout from '../../../components/dashboard/ApplicantLayout';
import Portfolio from '../../../components/portfolio/Portfolio';
import Profile from '../../../components/Profile';
import Application from '../../../components/Application';
import Settings from '../../../components/Settings';
import Wallet from '../../../components/WalletComponent';
import { Briefcase, Coins, Layers, Bell, MessageSquare, Pencil, X, AlertTriangle, Wallet as WalletIcon, Pointer } from 'lucide-react';
import useUnreadMessages from '../../../hooks/useUnreadMessages';
import ProfilePromotion from '../../../components/ProfilePromotion';

export default function ApplicantDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [unreadCountNotifications, setUnreadCountNotifications] = useState(0);
  const [incompleteFields, setIncompleteFields] = useState([]);
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  const [showAvatarPrompt, setShowAvatarPrompt] = useState(false);
  const fileInputRef = useRef(null);

  const unreadMessagesCount = useUnreadMessages();

  // Fetch profile and stats
  const fetchProfile = async () => {
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

    // Check for incomplete profile fields
    if (profileData) {
      const missingFields = [];
      if (!profileData.avatar_url) missingFields.push('avatar_url');
      if (!profileData.phone) missingFields.push('phone');
      if (!profileData.full_address) missingFields.push('full_address');
      if (!profileData.bio) missingFields.push('bio');
      if (!profileData.specialties) missingFields.push('specialties');
      
      setIncompleteFields(missingFields);
      
      // Show avatar prompt if avatar_url is null
      setShowAvatarPrompt(!profileData.avatar_url);
    }

    // Show token warning if balance is 0
    setShowTokenWarning((tokenData?.balance || 0) === 0);
  };

  useEffect(() => {
    fetchProfile();
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
      else setUnreadCountNotifications(data.filter((n) => !n.is_read).length);
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
      setProfile((prev) => ({ ...prev, avatar_url: data.publicUrl }));
      // Remove avatar_url from incomplete fields if it was there
      setIncompleteFields(prev => prev.filter(field => field !== 'avatar_url'));
      // Hide the avatar prompt after successful upload
      setShowAvatarPrompt(false);
    }
  };

  const getFieldMessage = (field) => {
    const messages = {
      avatar_url: 'Add your profile photo',
      phone: 'Add your phone number',
      full_address: 'Add your full address',
      bio: 'Add your bio',
      specialties: 'Add your specialties'
    };
    return messages[field] || 'Complete this field';
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
          {/* Welcome & Notifications */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-semibold">
                Hello!, {profile?.full_name || 'Creative'}
              </h2>
              <p className="text-sm text-gray-500">wishing you goodluck today!</p>
            </div>

            <div className="flex items-center gap-4">
              <a href="/messages" title="Messages" className="relative">
                <MessageSquare className="w-6 h-6 text-gray-700 hover:text-orange-600" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {unreadMessagesCount}
                  </span>
                )}
              </a>

              <a href="/dashboard/applicant/notifications" title="Notifications" className="relative">
                <Bell className="w-6 h-6 text-gray-700 hover:text-orange-600" />
                {unreadCountNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {unreadCountNotifications}
                  </span>
                )}
              </a>

              <div className="relative group">
                {/* Avatar Upload Area */}
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border-2 border-orange-500 object-cover"
                      onError={(e) => {
                        e.target.src = 'https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/default.jpg';
                      }}
                    />
                  ) : (
                    <img
                      src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/default.jpg"
                      alt="Default Avatar"
                      className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border-2 border-orange-500 object-cover"
                    />
                  )}
                  
                  {/* Edit Button */}
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow group-hover:flex hidden md:group-hover:flex md:flex hover:bg-orange-100"
                  >
                    <Pencil size={14} className="text-gray-700" />
                  </button>

                  {/* Bouncing Finger Icon with Popup */}
                  <AnimatePresence>
                    {showAvatarPrompt && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute top-12 -right-14 z-10"
                      >
                        {/* Bouncing Finger Icon */}
                        <motion.div
                          animate={{
                            y: [0, -10, 0],
                            rotate: [0, -5, 0],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="flex justify-center mb-2"
                        >
                          <Pointer className="w-5 h-5 text-orange-500 transform rotate-45" />
                        </motion.div>

                        {/* Popup Message - Now positioned below the finger */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/50 border border-orange-200 rounded-lg p-2 shadow-lg min-w-[150px]"
                        >
                          <p className="text-xs text-gray-700 font-medium text-center">
                            Click here to upload your profile photo
                          </p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

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

          {/* Incomplete Profile Warnings */}
          <AnimatePresence>
            {incompleteFields.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-yellow-800 font-medium text-sm mb-2">
                      Scroll down, use the "Edit Profile" button to Complete your profile and get more gigs
                    </h3>
                    <div className="space-y-1">
                      {incompleteFields.map(field => (
                        <p key={field} className="text-yellow-700 text-sm">
                          • {getFieldMessage(field)}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Token Warning */}
          <AnimatePresence>
            {showTokenWarning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <WalletIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-blue-800 font-medium text-sm mb-1">
                        Top up your token wallet!
                      </h3>
                      <button
                        onClick={() => setShowTokenWarning(false)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-blue-700 text-sm">
                      Don't miss out on juicy gigs! Click the Wallet button in the sidebar to add tokens.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={<Coins className="text-orange-500" />} label="Token Balance" value={tokens} />
            <StatCard icon={<Briefcase className="text-orange-500" />} label="Applications" value={applicationsCount} />
            <StatCard icon={<Layers className="text-orange-500" />} label="Portfolios" value={projectsCount} />
          </div>

          {/* Promote Profile & Edit Profile Buttons */}
          <div className="flex flex-wrap gap-4 mt-6">
            {/* Promote Profile */}
            {profile && (
              <ProfilePromotion profile={profile} refreshProfile={fetchProfile} />
            )}

            {/* Edit Profile Button with Flicker Effect */}
            <motion.a
              href="/dashboard/applicant/edit"
              className="mt-6 px-6 py-3 bg-orange-500 text-white rounded-xl shadow hover:bg-orange-600 transition relative"
              animate={
                incompleteFields.length > 0 ? {
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    '0 10px 15px -3px rgba(249, 115, 22, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  ]
                } : {}
              }
              transition={{
                duration: 2,
                repeat: incompleteFields.length > 0 ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              Edit Profile
              {incompleteFields.length > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  !
                </motion.span>
              )}
            </motion.a>
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

      {/* Wallet tab */}
      {activeTab === 'token' && (
        <div className="md:pt-20">
          <Wallet balance={tokens} refreshBalance={fetchProfile} />
        </div>
      )}
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