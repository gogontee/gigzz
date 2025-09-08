"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";
import { FaLaptopCode, FaBuilding, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import { motion } from "framer-motion";
import FeatureTab from "../components/FeatureTab";
import AllJobs from "../components/AllJobs";
import TestimonialCard from "../components/TestimonialCard";
import AddTestimonial from "../components/AddTestimonial";
import { supabase } from "../utils/supabaseClient";

export default function Home() {
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);

  // Fetch hero media from Supabase "header" bucket
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

  // Handle slide change (image → 5s, video → wait till end)
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
      {/* ✅ Hero Section (edge-to-edge, no side spacing issue) */}
      <div className="w-full relative overflow-hidden md:pt-80 aspect-[1920/480]">
        {media.length > 0 && (
          <>
            {media[currentIndex].endsWith(".mp4") ||
            media[currentIndex].endsWith(".webm") ? (
              <video
                key={media[currentIndex]}
                ref={videoRef}
                src={media[currentIndex]}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
            ) : (
              <Image
                key={media[currentIndex]}
                src={media[currentIndex]}
                alt="Hero Media"
                fill
                className="object-cover"
              />
            )}
          </>
        )}
      </div>

      {/* ✅ Tagline under hero */}
      <p className="mt-6 text-center text-gray-700 text-sm md:text-base">
        Your all-in-one freelance platform for remote, hybrid, and onsite jobs.
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
      <div className="hidden md:grid mt-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        <FeatureTab icon={<FaLaptopCode />} title="Remote Jobs" href="/remote" />
        <FeatureTab icon={<FaBuilding />} title="Hybrid Jobs" href="/hybrid" />
        <FeatureTab icon={<FaMapMarkerAlt />} title="Onsite Jobs" href="/onsite" />
        <FeatureTab icon={<FaClock />} title="Contract" href="/contract" />
      </div>

      {/* ✅ Insert AllJobs (toggle removed, spacing reduced) */}
      <div className="mt-8">
        <AllJobs />
      </div>

      {/* ✅ Category Section */}
      <div className="mt-14">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center">
          Discover Jobs by Profession
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
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
                className="bg-white border border-black hover:border-orange-600 p-2 md:p-4 rounded-lg text-center cursor-pointer transition"
              >
                <span className="text-xs md:text-sm font-medium">
                  {category.label}
                </span>
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
            "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "https://www.youtube.com/embed/3fumBcKC6RE",
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
