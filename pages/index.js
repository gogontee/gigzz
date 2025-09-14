"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";
import MobileHeader from "../components/MobileHeader"; // ✅ Import Mobile Header
import { FaLaptopCode, FaBuilding, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import FeatureTab from "../components/FeatureTab";
import AllJobs from "../components/AllJobs";
import TestimonialCard from "../components/TestimonialCard";
import AddTestimonial from "../components/AddTestimonial";
import { supabase } from "../utils/supabaseClient";

export default function Home() {
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);

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
      if (data) {
        const urls = data.map(
          (file) =>
            supabase.storage.from("header").getPublicUrl(file.name).data.publicUrl
        );
        setMedia(urls);
      }
    };
    fetchMedia();
  }, []);

  // ✅ Handle slide change (image → 5s, video → wait till end)
  useEffect(() => {
    if (!media.length) return;

    const current = media[currentIndex];
    if (current.endsWith(".mp4") || current.endsWith(".webm")) {
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
  }, [currentIndex, media]);

  return (
    <div className="flex flex-col min-h-screen text-black bg-white">
      {/* ✅ Mobile Header */}
      <div className="md:hidden">
        <MobileHeader />
      </div>

      {/* ✅ Hero Section with thin spacing on mobile, large on desktop */}
      <div className="w-full relative overflow-hidden mt-2 md:mt-20"> 
        <div className="relative w-full aspect-[3/1] md:aspect-[1920/600]">
          <AnimatePresence mode="wait">
            {media.length > 0 && (
              <>
                {media[currentIndex].endsWith(".mp4") ||
                media[currentIndex].endsWith(".webm") ? (
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

      {/* ✅ Tagline under hero */}
      <p className="mt-6 text-center text-gray-700 text-sm md:text-base">
        Your gateway top job and side gigs.
      </p>

      {/* ✅ Mobile → job type icons */}
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

      {/* ✅ Desktop → feature tabs with icons + text */}
      <div className="hidden md:flex justify-center gap-8 mt-8 flex-wrap">
        <FeatureTab icon={<FaLaptopCode />} title="Remote Jobs" href="/remote" className="max-w-xs w-full" />
        <FeatureTab icon={<FaBuilding />} title="Hybrid Jobs" href="/hybrid" className="max-w-xs w-full" />
        <FeatureTab icon={<FaMapMarkerAlt />} title="Onsite Jobs" href="/onsite" className="max-w-xs w-full" />
        <FeatureTab icon={<FaClock />} title="Contract" href="/contract" className="max-w-xs w-full" />
      </div>

      {/* ✅ Insert AllJobs */}
      <div className="mt-8">
        <AllJobs /> {/* 👈 This will now render jobs sorted: Premium → Gold → Silver → NULL */}
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
            "https://www.youtube.com/embed/tbnzAVRZ9Xc",
            "https://www.youtube.com/embed/B-ekqBF2EMo",
            "https://www.youtube.com/embed/fyOww2Yt8mM",
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
      <div className="mt-14">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center">
          What People Say About Gigzz
        </h2>
        <TestimonialCard />

        <div className="mt-10">
          <AddTestimonial />
        </div>
      </div>

      {/* ✅ Desktop-only Footer */}
      <div className="hidden md:block mt-20">
        <Footer />
      </div>
    </div>
  );
}
