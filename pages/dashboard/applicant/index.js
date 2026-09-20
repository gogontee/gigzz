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
import Verify from '../../../components/Verify';
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
  ShieldCheck,
  Shield,
  Clock,
  CheckCircle2,
  Zap,
  Timer,
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

  // Verification record (null if not submitted yet)
  const [verification, setVerification] = useState(null);

  // Popups
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showPromotionPopup, setShowPromotionPopup] = useState(false);
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);

  // 🔔 Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCountNotifications, setUnreadCountNotifications] = useState(0);

  const fileInputRef = useRef(null);

  const unreadMessagesCount = useUnreadMessages();

  /* --------------------------------------------------------------
     Verification prompt — once per session, only for unverified users
  -------------------------------------------------------------- */
  useEffect(() => {
    const checkVerificationPrompt = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const userId = userData.user.id;
      const sessionKey = `verifyPromptShown_${userId}`;

      if (sessionStorage.getItem(sessionKey)) return;

      const { data: v } = await supabase
        .from('verifications')
        .select('approved')
        .eq('user_id', userId)
        .maybeSingle();

      const approved = v?.approved?.toLowerCase();
      const needsVerification =
        !v ||
        !approved ||
        approved === 'rejected' ||
        approved === 'unverified' ||
        approved === 'unverify';

      if (needsVerification) {
        sessionStorage.setItem(sessionKey, 'true');
        setTimeout(() => setShowVerifyPopup(true), 1200);
      }
    };

    checkVerificationPrompt();
  }, []);

  /* --------------------------------------------------------------
     Popup orchestration (profile / promotion)
  -------------------------------------------------------------- */
  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const userId = userData.user.id;

      const { data: profileData } = await supabase
        .from('applicants')
        .select('full_name, bio, skills')
        .eq('id', userId)
        .maybeSingle();

      const isComplete =
        !!profileData?.full_name &&
        !!profileData?.bio &&
        !!profileData?.skills;

      const seenProfilePopup = localStorage.getItem(
        `hasSeenProfilePopup_${userId}`
      );
      const seenPromotionPopup = localStorage.getItem(
        `hasSeenPromotionPopup_${userId}`
      );

      if (!seenProfilePopup && !isComplete) {
        setTimeout(() => setShowProfilePopup(true), 900);
        return;
      }

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
     Fetch profile + stats + verification
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

    const { data: verificationData } = await supabase
      .from('verifications')
      .select('id, approved')
      .eq('user_id', userId)
      .maybeSingle();

    setProfile(profileData);
    setTokens(tokenData?.balance || 0);
    setApplicationsCount(applicationsCount || 0);
    setProjectsCount(projectsCount || 0);
    setVerification(verificationData || null);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  /* --------------------------------------------------------------
     Avatar change
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

  const handleVerifyNow = () => {
    setShowVerifyPopup(false);
    setActiveTab('verify');
  };

  const handleVerifyLater = () => {
    setShowVerifyPopup(false);
  };

  /* --------------------------------------------------------------
     Notification close
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

  /* --------------------------------------------------------------
     Verification status for the card
  -------------------------------------------------------------- */
  const verificationStatus = (() => {
    if (!verification) {
      return {
        label: 'Not verified',
        sub: 'Verify your identity to unlock client trust and better job matches.',
        Icon: Shield,
        color: 'orange',
        cta: 'Verify now',
      };
    }
    if (verification.approved === 'verified') {
      return {
        label: 'Verified',
        sub: 'Your identity is verified. A green badge appears on your profile.',
        Icon: CheckCircle2,
        color: 'green',
        cta: 'View',
      };
    }
    if (verification.approved === 'pending') {
      return {
        label: 'Pending review',
        sub: "We're reviewing your submission. Most reviews finish in 24–48h.",
        Icon: Clock,
        color: 'amber',
        cta: 'View',
      };
    }
    return {
      label: 'Needs attention',
      sub: "Your last submission wasn't approved. Please resubmit.",
      Icon: Shield,
      color: 'red',
      cta: 'Resubmit',
    };
  })();

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
          VERIFY PROMPT POPUP
      ============================================================ */}
      <AnimatePresence>
        {showVerifyPopup && (
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
              <div className="relative bg-gradient-to-br from-black via-gray-900 to-gray-800 px-6 pt-6 pb-7 text-white">
                <button
                  onClick={handleVerifyLater}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-400/15 border border-orange-400/30 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                    Free · Under a minute
                  </span>
                </div>

                <h3 className="text-xl font-bold leading-snug">
                  Get verified for free
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  Unlock trust and reach more clients
                </p>
              </div>

              <div className="px-6 py-6 space-y-5">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-semibold text-gray-900">
                        Green verified badge
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Shows on your profile and applications
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-semibold text-gray-900">
                        Up to 3× more responses
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Clients trust verified profiles faster
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center mt-0.5">
                      <Zap className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-semibold text-gray-900">
                        Priority in search
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Rank above unverified profiles
                      </p>
                    </div>
                  </li>
                </ul>

                <div className="rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 p-3 flex items-start gap-2.5">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-white border border-orange-200 flex items-center justify-center">
                    <Timer className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-orange-900">
                      Takes less than a minute
                    </p>
                    <p className="text-[11px] text-orange-800 mt-0.5 leading-relaxed">
                      One quick selfie + upload a valid ID. That's it.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={handleVerifyNow}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-orange-500 transition-colors shadow-sm"
                >
                  Verify now
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleVerifyLater}
                  className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors"
                >
                  I'll verify later
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
          className="space-y-5 md:space-y-6 md:pt-20 relative"
        >
          {/* Header row: welcome + actions */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl md:text-2xl font-semibold truncate">
                Welcome back, {profile?.full_name || 'Creative'}
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                Let's start making money today!
              </p>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <a
                href="/messages"
                title="Messages"
                className="relative p-1"
              >
                <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-gray-700 hover:text-orange-600 transition-colors" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full font-bold">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </span>
                )}
              </a>

              <button
                onClick={() => setShowNotifications(true)}
                title="Notifications"
                className="relative p-1"
              >
                <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-700 hover:text-orange-600 transition-colors" />
                {unreadCountNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full font-bold">
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
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-orange-500 object-cover"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-0 right-0 bg-white p-0.5 md:p-1 rounded-full shadow hidden md:flex items-center justify-center hover:bg-orange-100"
                  aria-label="Change avatar"
                >
                  <Pencil size={12} className="text-gray-700" />
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
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <StatCard
              icon={<Coins className="w-4 h-4 md:w-5 md:h-5" />}
              label="Tokens"
              value={tokens}
            />
            <StatCard
              icon={<Briefcase className="w-4 h-4 md:w-5 md:h-5" />}
              label="Apps"
              value={applicationsCount}
            />
            <StatCard
              icon={<Layers className="w-4 h-4 md:w-5 md:h-5" />}
              label="Projects"
              value={projectsCount}
            />
          </div>

          {/* Verification Card */}
          {(() => {
            const { label, sub, Icon, color, cta } = verificationStatus;

            const themeMap = {
              orange: {
                chip: 'bg-orange-100 text-orange-600 border-orange-200',
                btn: 'bg-black text-white hover:bg-orange-500',
              },
              green: {
                chip: 'bg-green-100 text-green-600 border-green-200',
                btn: 'bg-black text-white hover:bg-orange-500',
              },
              amber: {
                chip: 'bg-amber-100 text-amber-600 border-amber-200',
                btn: 'bg-black text-white hover:bg-orange-500',
              },
              red: {
                chip: 'bg-red-100 text-red-600 border-red-200',
                btn: 'bg-black text-white hover:bg-orange-500',
              },
            };
            const t = themeMap[color];

            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="flex items-start sm:items-center gap-3 p-4 md:p-5">
                  <div
                    className={`shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl border flex items-center justify-center ${t.chip}`}
                  >
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">
                        {label}
                      </p>
                      {color === 'green' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500 text-white">
                          Trusted
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] md:text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {sub}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('verify')}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-[11px] md:text-xs font-semibold transition-colors ${t.btn}`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{cta}</span>
                  </button>
                </div>
              </motion.div>
            );
          })()}

          {/* Action buttons — Promote + Edit side by side */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            {profile && (
              <div className="[&>*]:!mt-0 [&>*]:!w-full [&_button]:!w-full [&_button]:!px-3 [&_button]:!py-2.5 [&_button]:!text-[11px] sm:[&_button]:!text-sm [&_button]:!rounded-xl [&_button]:!font-semibold [&_button]:!shadow-sm [&_button]:!h-full [&_button]:!flex [&_button]:!items-center [&_button]:!justify-center">
                <ProfilePromotion
                  profile={profile}
                  refreshProfile={fetchProfile}
                />
              </div>
            )}

            <a
              href="/dashboard/applicant/edit"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-6 sm:py-3 bg-orange-500 text-white text-[11px] sm:text-sm font-semibold rounded-xl shadow-sm hover:bg-orange-600 transition h-full"
            >
              <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Edit Profile</span>
            </a>
          </div>
        </motion.div>
      )}

      {/* Other tabs */}
      {activeTab === 'portfolio' && <Portfolio />}
      {activeTab === 'profile' && profile && <Profile userId={profile.id} />}
      {activeTab === 'applications' && <Application />}
      {activeTab === 'settings' && <Settings />}

      {activeTab === 'verify' && profile && (
        <div className="md:pt-20">
          <Verify applicant={profile} />
        </div>
      )}

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

/* --------------------------------------------------------------
   Stat card — compact, responsive
-------------------------------------------------------------- */
function StatCard({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-xl md:rounded-2xl shadow-sm p-3 md:p-4 text-center min-h-[78px] md:min-h-[100px]">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-1.5 md:mb-2">
        {icon}
      </div>
      <p className="text-gray-500 text-[10px] md:text-xs font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm md:text-lg font-bold text-gray-900 mt-0.5">
        {value}
      </p>
    </div>
  );
}