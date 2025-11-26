"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";
import MobileHeader from "../components/MobileHeader"; 
import { FaLaptopCode, FaBuilding, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import FeatureTab from "../components/FeatureTab";
import AllJobs from "../components/AllJobs";
import TestimonialCard from "../components/TestimonialCard";
import AddTestimonial from "../components/AddTestimonial";
import { supabase } from "../utils/supabaseClient";

export default function Home() {
  const [media, setMedia] = useState([
    // ✅ Fallback media
    "https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/header/hero5.jpg",
    "https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/header/gigzz.jpg",
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);

  // ✅ Detect Instagram in-app browser
  const [isInApp, setIsInApp] = useState(false);
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsInApp(navigator.userAgent.includes("Instagram"));
    }
  }, []);

  // ✅ Modal state
  const [showForm, setShowForm] = useState(false);

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

  return (
    <div className="flex flex-col min-h-screen text-black bg-white">
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
        Your gateway to top jobs and side gigs.
      </p>

      {/* ✅ Mobile job type icons */}
      <div className="mt-8 flex justify-center gap-12 md:hidden">
        {[
          { icon: <FaLaptopCode />, label: "Remote", href: "/remote" },
          { icon: <FaBuilding />, label: "Hybrid", href: "/hybrid" },
          { icon: <FaMapMarkerAlt />, label: "Onsite", href: "/onsite" },
          { icon: <FaClock />, label: "Contract", href: "/contract" },
        ].map((item, i) => (
          <Link key={i} href={item.href}>
            <motion.div
              whileHover={{ scale: 1.1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex flex-col items-center text-black hover:text-orange-400 text-2xl cursor-pointer"
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* ✅ Desktop feature tabs */}
      <div className="hidden md:flex justify-center gap-8 mt-8 flex-wrap">
        <FeatureTab icon={<FaLaptopCode />} title="Remote Jobs" href="/remote" />
        <FeatureTab icon={<FaBuilding />} title="Hybrid Jobs" href="/hybrid" />
        <FeatureTab icon={<FaMapMarkerAlt />} title="Onsite Jobs" href="/onsite" />
        <FeatureTab icon={<FaClock />} title="Contract" href="/contract" />
      </div>

      {/* ✅ All Jobs */}
      <div className="mt-8">
        <AllJobs />
      </div>

      {/* ✅ Category Section */}
      <div className="mt-7 px-4 md:px-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-6 text-center">
          Discover Jobs by Profession
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[
            { label: "Design & Creative" },
            { label: "Development & IT" },
            { label: "Marketing & Sales" },
            { label: "Writing & Translation" },
            { label: "Customer Support" },
            { label: "Finance & Accounting" },
            { label: "Acting & Modelling" },
            { label: "Music and DJs" },
            { label: "Legal Services" },
            { label: "Engineering" },
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
