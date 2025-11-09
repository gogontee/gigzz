import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, Grid3x3, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import Footer from "../components/Footer";
import MobileHeader from "../components/MobileHeader";
import JobCard from "../components/JobCard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const categories = [
  "All",
  "Design & Creative",
  "Engineering",
  "Marketing & Sales",
  "Development & IT",
  "Customer Support",
  "Legal Services",
  "Finance & Accounting",
  "Acting & Modelling",
  "Writing & Translation",
  "Influencers and PR",
  "Finance",
];

export default function OnsiteJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const fetchOnsiteJobs = async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("category", "Onsite");

      if (error) {
        console.error("Error fetching onsite jobs:", error);
      } else {
        // Custom sort: promotion_tag priority, then created_at desc
        const priority = { Premium: 1, Gold: 2, Silver: 3, null: 4 };
        const sortedJobs = data.sort((a, b) => {
          const rankA = priority[a.promotion_tag] ?? 4;
          const rankB = priority[b.promotion_tag] ?? 4;
          if (rankA !== rankB) return rankA - rankB;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setJobs(sortedJobs);
      }
    };

    fetchOnsiteJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const title = job.title?.toLowerCase() || "";
    const company = job.company?.toLowerCase() || "";
    const tags = job.tags || [];

    const matchesSearch =
      title.includes(search.toLowerCase()) ||
      company.includes(search.toLowerCase());

    const matchesCategory =
      activeCategory === "All"
        ? true
        : tags.some((tag) =>
            tag.toLowerCase().includes(activeCategory.toLowerCase())
          );

    return matchesSearch && matchesCategory;
  });

  // Shuffle promo images
  const promoImages = [
    {
      src: "https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/generalphoto//1.jpg",
      href: "/remote",
      label: "Find Remote Jobs",
    },
    {
      src: "https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/generalphoto//2.jpg",
      href: "/hybrid",
      label: "View Hybrid Jobs",
    },
    {
      src: "https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/generalphoto//4.jpg",
      href: "/contract",
      label: "Contract / Part-time",
    },
  ].sort(() => Math.random() - 0.5);

  return (
    <>
      {/* Sticky Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-gray-200">
        <MobileHeader />
      </div>

      <div className="pt-4 md:pt-24 px-4 max-w-6xl mx-auto">
        {/* Title + Toggle */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-extrabold text-black">Onsite Jobs</h1>
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="p-2 rounded-full bg-gray-100 hover:bg-orange-100 transition"
          >
            {viewMode === "grid" ? <List size={18} /> : <Grid3x3 size={18} />}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search onsite jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 pl-10 pr-3 rounded-lg text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-1 mb-6">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <motion.button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                whileTap={{ scale: 0.95 }}
                className={`px-1.5 py-0.5 text-[10px] md:px-4 md:py-1.5 md:text-sm rounded-full border transition ${
                  isActive
                    ? "bg-black text-white border-black"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {cat}
              </motion.button>
            );
          })}
        </div>

        {/* Job Grid/List with shuffled images */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 md:grid-cols-3 gap-4"
              : "space-y-4"
          }
        >
          <AnimatePresence>
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <JobCard
                  job={{
                    id: job.id,
                    title: job.title,
                    location: job.location,
                    type: job.type,
                    min_price: job.min_price,
                    max_price: job.max_price,
                    price_frequency: job.price_frequency,
                    tags: job.tags || [],
                    description: job.description || "",
                    avatar_url: job.avatar_url,
                  }}
                  viewMode={viewMode}
                />
              </motion.div>
            ))}

            {/* Insert promo images */}
            {filteredJobs.length > 0 &&
              promoImages.map((img, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative rounded-xl overflow-hidden shadow-md group"
                >
                  <Image
                    src={img.src}
                    alt={img.label}
                    layout="responsive"
                    width={500}
                    height={300}
                    className="group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-end justify-end p-4">
                    <Link href={img.href}>
                      <button className="bg-white text-black px-3 py-1.5 text-sm rounded-lg font-semibold hover:bg-orange-600 hover:text-white transition">
                        {img.label}
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {/* No Jobs */}
        {filteredJobs.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 text-sm text-center text-gray-500"
          >
            No onsite jobs found.
          </motion.p>
        )}

        {/* Desktop Only Footer */}
        <div className="hidden md:block mt-20">
          <Footer />
        </div>
      </div>
    </>
  );
}
