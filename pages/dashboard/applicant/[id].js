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
import { Briefcase, Coins, Layers, Bell, MessageSquare, Pencil, X, Star, Edit3, TrendingUp } from 'lucide-react';
import useUnreadMessages from '../../../hooks/useUnreadMessages';
import ProfilePromotion from '../../../components/ProfilePromotion';

export default function ApplicantDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [unreadCountNotifications, setUnreadCountNotifications] = useState(0);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showPromotionPopup, setShowPromotionPopup] = useState(false);
  const [hasSeenProfilePopup, setHasSeenProfilePopup] = useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const fileInputRef = useRef(null);

  const unreadMessagesCount = useUnreadMessages();

  // Check if user is new and show appropriate popups
  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      // Check if user has seen the profile popup before
      const seenProfilePopup = localStorage.getItem(`hasSeenProfilePopup_${userData.user.id}`);
      const profileCompleted = localStorage.getItem(`hasCompletedProfile_${userData.user.id}`);
      
      setHasSeenProfilePopup(!!seenProfilePopup);
      setHasCompletedProfile(!!profileCompleted);

      // If user hasn't seen popup and hasn't completed profile, show it
      if (!seenProfilePopup && !profileCompleted) {
        setTimeout(() => {
          setShowProfilePopup(true);
        }, 1000);
      }
    };

    checkUserStatus();
  }, []);

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

    // Check if profile is completed (has basic info filled)
    if (profileData) {
      const isProfileComplete = profileData.full_name && profileData.bio && profileData.skills;
      setHasCompletedProfile(isProfileComplete);
      
      if (isProfileComplete) {
        localStorage.setItem(`hasCompletedProfile_${userId}`, 'true');
      }
    }
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
    }
  };

  const handleEditProfileClick = () => {
    const userId = profile?.id;
    if (userId) {
      localStorage.setItem(`hasSeenProfilePopup_${userId}`, 'true');
      setShowProfilePopup(false);
      
      // Show promotion popup after a delay if profile is completed
      setTimeout(() => {
        if (hasCompletedProfile) {
          setShowPromotionPopup(true);
        }
      }, 1500);
    }
  };

  const handleClosePromotionPopup = () => {
    setShowPromotionPopup(false);
  };

  return (
    <ApplicantLayout
      applicant={profile}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* Profile Completion Popup */}
      <AnimatePresence>
        {showProfilePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Edit3 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Complete Your Profile</h3>
                  <p className="text-sm text-gray-600">Let clients know more about you</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">1</span>
                  </div>
                  Add your professional bio and skills
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">2</span>
                  </div>
                  Upload a professional profile picture
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">3</span>
                  </div>
                  Showcase your portfolio projects
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleEditProfileClick}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                >
                  Edit Profile Now
                </button>
              </div>
              
              <p className="text-xs text-gray-500 text-center mt-3">
                Complete your profile to increase your chances of getting hired
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Promotion Popup */}
      <AnimatePresence>
        {showPromotionPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Boost Your Visibility</h3>
                    <p className="text-sm text-gray-600">Get discovered by more clients</p>
                  </div>
                </div>
                <button
                  onClick={handleClosePromotionPopup}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Featured in Spotlight</p>
                    <p className="text-xs text-gray-600">Your profile appears on the main spotlight page</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Higher Search Ranking</p>
                    <p className="text-xs text-gray-600">Appear at the top of client searches</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Direct Job Offers</p>
                    <p className="text-xs text-gray-600">Clients can contact you directly</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-purple-800 text-center">
                  <strong>Pro Tip:</strong> Promote your profile to get 3x more visibility!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                Welcome back, {profile?.full_name || 'Creative'}
              </h2>
              <p className="text-sm text-gray-500">Let's start making money today!</p>
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

          {/* Stats - Updated for mobile responsiveness with smaller size */}
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            <MobileStatCard icon={<Coins className="text-orange-500 w-4 h-4 md:w-5 md:h-5" />} label="Tokens" value={tokens} />
            <MobileStatCard icon={<Briefcase className="text-orange-500 w-4 h-4 md:w-5 md:h-5" />} label="Apps" value={applicationsCount} />
            <MobileStatCard icon={<Layers className="text-orange-500 w-4 h-4 md:w-5 md:h-5" />} label="Projects" value={projectsCount} />
          </div>

          {/* Promote Profile & Edit Profile Buttons */}
          <div className="flex flex-wrap gap-4 mt-6">
            {/* Promote Profile */}
            {profile && (
              <ProfilePromotion profile={profile} refreshProfile={fetchProfile} />
            )}

            {/* Edit Profile */}
            <a
              href="/dashboard/applicant/edit"
              className="mt-6 px-6 py-3 bg-orange-500 text-white rounded-xl shadow hover:bg-orange-600 transition"
              onClick={handleEditProfileClick}
            >
              Edit Profile
            </a>
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

// New MobileStatCard for mobile screens - Much smaller
function MobileStatCard({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 p-2 md:p-3 rounded-lg md:rounded-xl shadow-sm text-center min-h-[80px] md:min-h-[100px]">
      <div className="p-1.5 md:p-2 bg-white rounded-full shadow mb-1 md:mb-2">
        {icon}
      </div>
      <div>
        <p className="text-gray-600 text-[10px] md:text-xs font-medium">{label}</p>
        <p className="text-xs md:text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}