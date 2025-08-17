"use client";

import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";
import { FaLaptopCode, FaBuilding, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import { motion } from "framer-motion";
import FeatureTab from "../components/FeatureTab";
import AllJobs from "../components/AllJobs";
import TestimonialCard from "../components/TestimonialCard";
import AddTestimonial from "../components/AddTestimonial"; // ✅ Import form

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen text-black bg-white">
      {/* Header Section */}
      <div className="px-4 md:px-10 pt-8 md:pt-20">
        <h1 className="text-3xl md:text-5xl font-bold text-center">
          Welcome to <span className="text-black-600">GIGZZ</span>
        </h1>
        <p className="mt-4 text-center text-gray-700 max-w-2xl mx-auto">
          Your all-in-one freelance platform for remote, hybrid, and onsite jobs.
        </p>
      </div>

      {/* Feature Tabs Section */}
      <div className="mt-10 px-4 md:px-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        <FeatureTab icon={<FaLaptopCode />} title="Remote Jobs" href="/remote" />
        <FeatureTab icon={<FaBuilding />} title="Hybrid Jobs" href="/hybrid" />
        <FeatureTab icon={<FaMapMarkerAlt />} title="Onsite Jobs" href="/onsite" />
        <FeatureTab icon={<FaClock />} title="Contract" href="/contract" />
      </div>

      {/* ✅ Insert AllJobs here */}
      <div className="mt-14">
        <AllJobs />
      </div>

      {/* Category Section */}
      <div className="mt-14 px-4 md:px-10">
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
  <span className="text-xs md:text-sm font-medium">{category.label}</span>
</motion.div>


            </Link>
          ))}
        </div>
      </div>

      {/* Video Section */}
      <div className="mt-14 px-4 md:px-10">
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
      <div className="mt-14 px-4 md:px-10">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center">
          What People Say About Gigzz
        </h2>
        <TestimonialCard />

        {/* ✅ Add Testimonial Form */}
        <div className="mt-10">
          <AddTestimonial />
        </div>
      </div>

      {/* Desktop-only Footer */}
      <div className="hidden md:block mt-20">
        <Footer />
      </div>
    </div>
  );
}
