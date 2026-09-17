'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../utils/supabaseClient';
import ApplicantLayout from '../../../components/dashboard/ApplicantLayout';
import Portfolio from '../../../components/portfolio/Portfolio';
import Profile from '../../../components/Profile';
import Application from '../../../components/Application';
import Settings from '../../../components/Settings';
import Wallet from '../../../components/WalletComponent';
import Notification from '../../../components/Notification';
import {
  Briefcase,
  Coins,
  Layers,
  MessageSquare,
  Pencil,
  X,
  Star,
  Edit3,
  TrendingUp,
  Bell,
  Sparkles,
  ArrowRight,
  User,
} from 'lucide-react';
import useUnreadMessages from '../../../hooks/useUnreadMessages';
import ProfilePromotion from '../../../components/ProfilePromotion';

export default function ApplicantDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);

  // Popups
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showPromotionPopup, setShowPromotionPopup] = useState(false);

  // 🔔 Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCountNotifications, setUnreadCountNotifications] = useState(0);

  const fileInputRef = useRef(null);

  const unreadMessagesCount = useUnreadMessages();

  /* --------------------------------------------------------------
     Popup orchestration
     - Profile popup: show if user hasn't seen it AND profile is incomplete
     - Promotion popup: show only if profile is COMPLETE and user hasn't
       dismissed it yet. Separate "seen" flag so the two don't collide.
  -------------------------------------------------------------- */
  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const userId = userData.user.id;

      // 1. Fetch the profile to know if it's complete
      const { data: profileData } = await supabase
        .from('applicants')
        .select('full_name, bio, skills')
        .eq('id', userId)
        .maybeSingle();

      const isComplete =
        !!profileData?.full_name &&
        !!profileData?.bio &&
        !!profileData?.skills;

      // 2. Popup seen flags
      const seenProfilePopup = localStorage.getItem(
        `hasSeenProfilePopup_${userId}`
      );
      const seenPromotionPopup = localStorage.getItem(
        `hasSeenPromotionPopup_${userId}`
      );

      // 3. Show profile popup first (if never seen + incomplete)
      if (!seenProfilePopup && !isComplete) {
        setTimeout(() => setShowProfilePopup(true), 900);
        return; // don't stack the promotion popup on top
      }

      // 4. Show promotion popup (if never seen + profile complete)
      if (isComplete && !seenPromotionPopup) {
        setTimeout(() => setShowPromotionPopup(true), 900);
      }
    };

    checkUserStatus();
  }, []);

  /* --------------------------------------------------------------
     Notification count + realtime
  -------------------------------------------------------------- */
  useEffect(() => {
    let mounted = true;
    let channel = null;

    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const userId = userData.user.id;

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (mounted) setUnreadCountNotifications(count || 0);

      channel = supabase
        .channel(`applicant-notif-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          async () => {
            const { count: freshCount } = await supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('is_read', false);
            if (mounted) setUnreadCountNotifications(freshCount || 0);
          }
        )
        .subscribe();
    };

    init();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  /* --------------------------------------------------------------
     Fetch profile + stats
  -------------------------------------------------------------- */
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
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  /* --------------------------------------------------------------
     Avatar change from dashboard header
  -------------------------------------------------------------- */
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

  /* --------------------------------------------------------------
     Popup actions
  -------------------------------------------------------------- */
  const handleEditProfileClick = () => {
    const userId = profile?.id;
    if (userId) {
      localStorage.setItem(`hasSeenProfilePopup_${userId}`, 'true');
    }
    setShowProfilePopup(false);
    router.push('/dashboard/applicant/edit');
  };

  const handleDismissProfilePopup = () => {
    const userId = profile?.id;
    if (userId) {
      localStorage.setItem(`hasSeenProfilePopup_${userId}`, 'true');
    }
    setShowProfilePopup(false);
  };

  const handleDismissPromotionPopup = () => {
    const userId = profile?.id;
    if (userId) {
      localStorage.setItem(`hasSeenPromotionPopup_${userId}`, 'true');
    }
    setShowPromotionPopup(false);
  };

  const handleExplorePromotion = () => {
    const userId = profile?.id;
    if (userId) {
      localStorage.setItem(`hasSeenPromotionPopup_${userId}`, 'true');
    }
    setShowPromotionPopup(false);
    router.push('/dashboard/applicant/spotlight');
  };

  /* --------------------------------------------------------------
     Recount unread on notification modal close
  -------------------------------------------------------------- */
  const handleCloseNotifications = async () => {
    setShowNotifications(false);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)
      .eq('is_read', false);

    setUnreadCountNotifications(count || 0);
  };

  return (
    <ApplicantLayout
      applicant={profile}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ============================================================
          PROFILE COMPLETION POPUP
      ============================================================ */}
      <AnimatePresence>
        {showProfilePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header — dark with orange accent */}
              <div className="relative bg-gradient-to-br from-black via-gray-900 to-gray-800 px-6 pt-6 pb-7 text-white">
                <button
                  onClick={handleDismissProfilePopup}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-400/15 border border-orange-400/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                    Get Started
                  </span>
                </div>

                <h3 className="text-xl font-bold leading-snug">
                  Complete your profile
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  Stand out to clients and land more gigs
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-5">
                <ul className="space-y-4">
                  {[
                    { n: 1, text: 'Add your professional bio and skills' },
                    { n: 2, text: 'Upload a professional profile picture' },
                    { n: 3, text: 'Showcase your portfolio projects' },
                  ].map(({ n, text }) => (
                    <li key={n} className="flex items-start gap-3">
                      <div className="shrink-0 w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-orange-600">
                          {n}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed pt-1">
                        {text}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="rounded-xl bg-orange-50 border border-orange-100 p-3">
                  <p className="text-xs text-orange-800 leading-relaxed">
                    <strong>Pro tip:</strong> Profiles with a bio, avatar, and at
                    least 3 portfolio pieces get <strong>4× more</strong>{' '}
                    responses from clients.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <button
                  onClick={handleEditProfileClick}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-orange-500 transition-colors shadow-sm"
                >
                  Edit Profile Now
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDismissProfilePopup}
                  className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          PROMOTION POPUP
      ============================================================ */}
      <AnimatePresence>
        {showPromotionPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header — dark with orange accent */}
              <div className="relative bg-gradient-to-br from-black via-gray-900 to-gray-800 px-6 pt-6 pb-7 text-white">
                <button
                  onClick={handleDismissPromotionPopup}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-400/15 border border-orange-400/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                    Next Step
                  </span>
                </div>

                <h3 className="text-xl font-bold leading-snug">
                  Boost your visibility
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  Get discovered by more clients
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-5">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center justify-center mt-0.5">
                      <Star className="w-3.5 h-3.5 text-yellow-600" />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-semibold text-gray-900">
                        Featured in Spotlight
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Appear on the main spotlight page clients browse daily
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-semibold text-gray-900">
                        Higher search ranking
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Show up at the top when clients search for your skills
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center mt-0.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-semibold text-gray-900">
                        Direct job offers
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Let clients reach out to you without applying
                      </p>
                    </div>
                  </li>
                </ul>

                <div className="rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 p-3">
                  <p className="text-xs text-orange-900 leading-relaxed">
                    <strong>Ready when you are.</strong> Your profile looks
                    great — promotion is the next step.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <button
                  onClick={handleExplorePromotion}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-orange-500 transition-colors shadow-sm"
                >
                  Explore Promotion
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDismissPromotionPopup}
                  className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors"
                >
                  Not now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          DASHBOARD TAB
      ============================================================ */}
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
              <p className="text-sm text-gray-500">
                Let's start making money today!
              </p>
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

              <button
                onClick={() => setShowNotifications(true)}
                title="Notifications"
                className="relative"
              >
                <Bell className="w-6 h-6 text-gray-700 hover:text-orange-600 transition-colors" />
                {unreadCountNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full font-bold">
                    {unreadCountNotifications > 9
                      ? '9+'
                      : unreadCountNotifications}
                  </span>
                )}
              </button>

              <div className="relative group">
                <img
                  src={
                    profile?.avatar_url ||
                    'https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png'
                  }
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
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            <MobileStatCard
              icon={<Coins className="text-orange-500 w-4 h-4 md:w-5 md:h-5" />}
              label="Tokens"
              value={tokens}
            />
            <MobileStatCard
              icon={
                <Briefcase className="text-orange-500 w-4 h-4 md:w-5 md:h-5" />
              }
              label="Apps"
              value={applicationsCount}
            />
            <MobileStatCard
              icon={<Layers className="text-orange-500 w-4 h-4 md:w-5 md:h-5" />}
              label="Projects"
              value={projectsCount}
            />
          </div>

          {/* Promote Profile & Edit Profile Buttons */}
          <div className="flex flex-wrap gap-4 mt-6">
            {profile && (
              <ProfilePromotion
                profile={profile}
                refreshProfile={fetchProfile}
              />
            )}

            <a
              href="/dashboard/applicant/edit"
              className="mt-6 px-6 py-3 bg-orange-500 text-white rounded-xl shadow hover:bg-orange-600 transition"
            >
              Edit Profile
            </a>
          </div>
        </motion.div>
      )}

      {/* Other tabs */}
      {activeTab === 'portfolio' && <Portfolio />}
      {activeTab === 'profile' && profile && <Profile userId={profile.id} />}
      {activeTab === 'applications' && <Application />}
      {activeTab === 'settings' && <Settings />}
      {activeTab === 'token' && (
        <div className="md:pt-20">
          <Wallet balance={tokens} refreshBalance={fetchProfile} />
        </div>
      )}

      {/* Notification modal */}
      <AnimatePresence>
        {showNotifications && profile?.id && (
          <Notification
            isOpen={showNotifications}
            onClose={handleCloseNotifications}
            userId={profile.id}
          />
        )}
      </AnimatePresence>
    </ApplicantLayout>
  );
}

function MobileStatCard({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 p-2 md:p-3 rounded-lg md:rounded-xl shadow-sm text-center min-h-[80px] md:min-h-[100px]">
      <div className="p-1.5 md:p-2 bg-white rounded-full shadow mb-1 md:mb-2">
        {icon}
      </div>
      <div>
        <p className="text-gray-600 text-[10px] md:text-xs font-medium">
          {label}
        </p>
        <p className="text-xs md:text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}