import { useEffect, useState } from "react";
import { List, Grid3x3, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import JobCard from "../components/JobCard";
import MobileHeader from "../components/MobileHeader";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Hybrid() {
  const [jobs, setJobs] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const fetchHybridJobs = async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .ilike("category", "%hybrid%"); // fetch only hybrid jobs

      if (error) {
        console.error("Error fetching hybrid jobs:", error);
      } else {
        // JS-side sorting by promotion_tag priority → created_at
        const priority = { Premium: 1, Gold: 2, Silver: 3, null: 4, undefined: 4 };
        const sorted = [...data].sort((a, b) => {
          const priA = priority[a.promotion_tag] ?? 4;
          const priB = priority[b.promotion_tag] ?? 4;
          if (priA !== priB) return priA - priB;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setJobs(sorted);
      }
    };

    fetchHybridJobs();
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

  const categories = [
    "All",
    "Agile",
    "Leadership",
    "SEO",
    "Strategy",
    "Sales",
    "Office",
    "Logistics",
  ];

  return (
    <>
      {/* Sticky Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-gray-200">
        <MobileHeader />
      </div>

      <div className="pt-4 md:pt-24 px-4 max-w-6xl mx-auto">
        {/* Title + Toggle */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-extrabold text-black">Hybrid Jobs</h1>
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
            placeholder="Search job titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 pl-10 pr-3 rounded-lg text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Category Filter (compact, mobile-first) */}
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

        {/* Job Grid/List */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 md:grid-cols-3 gap-4"
              : "space-y-4"
          }
        >
          <AnimatePresence>
            {filteredJobs.map((job) => (
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
          </AnimatePresence>
        </div>

        {/* No Jobs */}
        {filteredJobs.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 text-sm text-center text-gray-500"
          >
            No hybrid jobs found.
          </motion.p>
        )}
      </div>
    </>
  );
}
