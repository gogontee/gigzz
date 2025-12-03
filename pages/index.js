"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";
import MobileHeader from "../components/MobileHeader";
import { FaLaptopCode, FaBuilding, FaMapMarkerAlt, FaClock, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import FeatureTab from "../components/FeatureTab";
import AllJobs from "../components/AllJobs";
import TestimonialCard from "../components/TestimonialCard";
import AddTestimonial from "../components/AddTestimonial";
import { supabase } from "../utils/supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";

export default function Home() {
  const [media, setMedia] = useState([
    "https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/header/hero5.jpg",
    "https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/header/gigzz.jpg",
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);
  
  const user = useUser();
  const [userRole, setUserRole] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Popup states
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showWalletPopup, setShowWalletPopup] = useState(false);
  const [popupTimer, setPopupTimer] = useState(null);
  const [firstPopupTime, setFirstPopupTime] = useState(null);

  // ✅ Detect Instagram in-app browser
  const [isInApp, setIsInApp] = useState(false);
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsInApp(navigator.userAgent.includes("Instagram"));
    }
  }, []);

  // ✅ Modal state
  const [showForm, setShowForm] = useState(false);

  // ✅ Fetch user data and token balance
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          // Fetch user role
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setUserRole(userData?.role || null);

          // Fetch token balance for applicants
          if (userData?.role === 'applicant') {
            const { data: walletData } = await supabase
              .from('token_wallets')
              .select('balance')
              .eq('user_id', user.id)
              .single();
            
            setTokenBalance(walletData?.balance || 0);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [user]);

  // ✅ Popup timing logic
  useEffect(() => {
    if (isLoading) return;

    // Show auth popup for non-auth users after 20 seconds
    if (!user && !showAuthPopup && !firstPopupTime) {
      const timer = setTimeout(() => {
        setShowAuthPopup(true);
        setFirstPopupTime(Date.now());
      }, 20000); // 20 seconds

      return () => clearTimeout(timer);
    }

    // Show auth popup again after 3 minutes if still not authenticated
    if (!user && firstPopupTime && (Date.now() - firstPopupTime > 180000)) {
      const timer = setTimeout(() => {
        setShowAuthPopup(true);
      }, 180000); // 3 minutes

      return () => clearTimeout(timer);
    }

    // Show wallet popup for applicants with low token balance
    if (user && userRole === 'applicant' && tokenBalance !== null && tokenBalance < 3) {
      setShowWalletPopup(true);
    }

  }, [user, userRole, tokenBalance, isLoading, firstPopupTime, showAuthPopup]);

  // ✅ Close popup handlers
  const closeAuthPopup = () => {
    setShowAuthPopup(false);
  };

  const closeWalletPopup = () => {
    setShowWalletPopup(false);
  };

  // ✅ Fetch hero media from Supabase "header" bucket
  useEffect(() => {
    const fetchMedia = async () => {
      const { data, error } = await supabase.storage.from("header").list("", {
        limit: 20,
        offset: 0,
      });
      if (error) {
        console.error("Error fetching media:", error);
        return;
      }
      if (data && data.length > 0) {
        const urls = data.map(
          (file) =>
            supabase.storage.from("header").getPublicUrl(file.name).data.publicUrl
        );
        setMedia(urls);
      }
    };
    fetchMedia();
  }, []);

  // ✅ Handle slide change
  useEffect(() => {
    if (!media.length) return;

    const current = media[currentIndex];
    if (!isInApp && (current.endsWith(".mp4") || current.endsWith(".webm"))) {
      const videoEl = videoRef.current;
      if (videoEl) {
        videoEl.onended = () => {
          setCurrentIndex((prev) => (prev + 1) % media.length);
        };
      }
    } else {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % media.length);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, media, isInApp]);

  // ✅ Floating animation variants for job type icons
  const floatingAnimation = {
    animate: {
      y: [0, -10, 0],
      scale: [1, 1.05, 1],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-black bg-white">
      {/* ✅ Popup Modals */}
      {/* Auth Popup */}
      <AnimatePresence>
        {showAuthPopup && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
            >
              {/* Close button */}
              <button
                onClick={closeAuthPopup}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to Gigzz!</h3>
                <p className="text-gray-600 mb-6">
                  Do you have an account? Log in to access all features or create an account to get started.
                </p>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/auth/login"
                    onClick={closeAuthPopup}
                    className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-center"
                  >
                    Login to Your Account
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={closeAuthPopup}
                    className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium text-center"
                  >
                    Create New Account
                  </Link>
                  <button
                    onClick={closeAuthPopup}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  >
                    Continue Browsing
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Popup */}
      <AnimatePresence>
        {showWalletPopup && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
            >
              {/* Close button */}
              <button
                onClick={closeWalletPopup}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">Low Token Balance!</h3>
                <p className="text-gray-600 mb-4">
                  You have <span className="font-bold text-orange-600">{tokenBalance} tokens</span> remaining.
                </p>
                <p className="text-gray-600 mb-6">
                  You need at least <span className="font-bold text-orange-600">3 tokens</span> to apply for jobs. Fund your wallet now to keep applying!
                </p>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/wallet"
                    onClick={closeWalletPopup}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all font-medium text-center shadow-lg hover:shadow-xl"
                  >
                    💰 Fund Your Wallet
                  </Link>
                  <button
                    onClick={closeWalletPopup}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  >
                    Remind Me Later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Mobile Header */}
      <div className="md:hidden">
        <MobileHeader />
      </div>

      {/* ✅ Instagram warning banner */}
      {isInApp && (
        <div className="bg-yellow-100 text-yellow-800 text-center py-2 px-4 text-sm">
          For the best experience, please{" "}
          <strong>open this site in Chrome or Safari</strong>.
        </div>
      )}

      {/* ✅ Hero Section */}
      <div className="w-full relative overflow-hidden mt-2 md:mt-20">
        <div className="relative w-full aspect-[3/1] md:aspect-[1920/600]">
          <AnimatePresence mode="wait">
            {media.length > 0 && (
              <>
                {!isInApp &&
                (media[currentIndex].endsWith(".mp4") ||
                  media[currentIndex].endsWith(".webm")) ? (
                  <motion.video
                    key={media[currentIndex]}
                    ref={videoRef}
                    src={media[currentIndex]}
                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    autoPlay
                    muted
                    playsInline
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.8 }}
                  />
                ) : (
                  <motion.div
                    key={media[currentIndex]}
                    className="absolute inset-0"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.8 }}
                  >
                    <Image
                      src={media[currentIndex]}
                      alt="Hero Media"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ✅ Tagline */}
      <p className="mt-6 text-center text-gray-700 text-sm md:text-base">
        Your gateway to premium jobs and side gigs.
      </p>

      {/* ✅ Mobile job type icons with floating animation */}
      <div className="mt-8 flex justify-center gap-12 md:hidden">
        {[
          { icon: <FaLaptopCode />, label: "Remote", href: "/remote" },
          { icon: <FaBuilding />, label: "Hybrid", href: "/hybrid" },
          { icon: <FaMapMarkerAlt />, label: "Onsite", href: "/onsite" },
          { icon: <FaClock />, label: "Contract", href: "/contract" },
        ].map((item, i) => (
          <Link key={i} href={item.href}>
            <motion.div
              {...floatingAnimation}
              className="flex flex-col items-center text-black hover:text-orange-400 text-2xl cursor-pointer"
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* ✅ Desktop feature tabs with floating animation */}
      <div className="hidden md:flex justify-center gap-8 mt-8 flex-wrap">
        <motion.div {...floatingAnimation}>
          <FeatureTab icon={<FaLaptopCode />} title="Remote Jobs" href="/remote" />
        </motion.div>
        <motion.div {...floatingAnimation} transition={{ delay: 0.2, ...floatingAnimation.transition }}>
          <FeatureTab icon={<FaBuilding />} title="Hybrid Jobs" href="/hybrid" />
        </motion.div>
        <motion.div {...floatingAnimation} transition={{ delay: 0.4, ...floatingAnimation.transition }}>
          <FeatureTab icon={<FaMapMarkerAlt />} title="Onsite Jobs" href="/onsite" />
        </motion.div>
        <motion.div {...floatingAnimation} transition={{ delay: 0.6, ...floatingAnimation.transition }}>
          <FeatureTab icon={<FaClock />} title="Contract" href="/contract" />
        </motion.div>
      </div>

      {/* ✅ All Jobs */}
      <div className="mt-8">
        <AllJobs />
      </div>

      {/* ✅ Category Section - Updated */}
      <div className="mt-7 px-4 md:px-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-6 text-center">
          Discover Jobs by Industry
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[
            { label: "Design & Creatives" },
            { label: "Tech" }, // Changed from "Development & IT"
            { label: "Marketing & Sales" },
            { label: "Writing & Translation" },
            { label: "Customer Support" },
            { label: "Finance & Accounting" },
            { label: "Fashion" },
            { label: "Entertainment" },
            { label: "Legal Services" },
            { label: "Construction" }, // Changed from "Engineering"
            { label: "Advertising" },
            { label: "Hospitality" }, // Added new tab
            { label: "Transportation" }, // Added new tab
            { label: "Others" }, // Added new tab
          ].map((category, i) => (
            <Link
              key={i}
              href={{
                pathname: "/job/alljobs",
                query: { category: category.label },
              }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white border border-black hover:border-orange-600 p-1 md:p-2 rounded-md text-center cursor-pointer transition text-[10px] md:text-xs"
              >
                <span className="font-medium">{category.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* ✅ Video Section */}
      <div className="mt-14">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center">
          Learn About Gigzz
        </h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {[
            "https://www.youtube.com/embed/e6Fd_mFglo8?rel=0",
            "https://www.youtube.com/embed/e6Fd_mFglo8?rel=0",
            "https://www.youtube.com/embed/e6Fd_mFglo8?rel=0",
          ].map((src, i) => (
            <div key={i} className="min-w-[300px] md:min-w-[500px] aspect-video">
              <iframe
                className="w-full h-full rounded-lg"
                src={src}
                title={`Gigzz Video ${i + 1}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Testimonials Section */}
      <div className="mt-14 relative">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center">
          What People Say About Gigzz
        </h2>
        <TestimonialCard />

        {/* ✅ Button to open form modal */}
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Add Your Testimonial
          </button>
        </div>

        {/* ✅ Modal popup */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg relative"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                {/* Close button */}
                <button
                  onClick={() => setShowForm(false)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-black"
                >
                  ✕
                </button>

                <AddTestimonial onSuccess={() => setShowForm(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ✅ Desktop-only Footer */}
      <div className="hidden md:block mt-20">
        <Footer />
      </div>
    </div>
  );
}