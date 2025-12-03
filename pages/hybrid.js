import { useEffect, useState, useRef, useCallback } from "react";
import { List, Grid3x3, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import JobCard from "../components/JobCard";
import MobileHeader from "../components/MobileHeader";
import Footer from "../components/Footer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

// Helper: assign rank for promotion_tag
const getTagRank = (tag) => {
  if (tag === "Premium") return 1;
  if (tag === "Gold") return 2;
  if (tag === "Silver") return 3;
  return 4; // NULL or anything else
};

const INITIAL_LOAD_SIZE = 10;
const CONTINUOUS_LOAD_SIZE = 8;

export default function Hybrid() {
  const [allHybridJobs, setAllHybridJobs] = useState([]);
  const [displayedJobs, setDisplayedJobs] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [allJobsLoaded, setAllJobsLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const observerRef = useRef(null);
  const containerRef = useRef(null);

  // Load all hybrid jobs once on component mount
  useEffect(() => {
    fetchAllHybridJobs();
  }, []);

  // Filter jobs based on search and category
  useEffect(() => {
    applyFilters(allHybridJobs, search, activeCategory);
  }, [search, activeCategory, allHybridJobs]);

  // Initialize intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isFetching) {
          loadMoreJobs();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, loading, isFetching]);

  // Fetch ALL hybrid jobs from database
  const fetchAllHybridJobs = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .or('category.ilike.%hybrid%,title.ilike.%hybrid%,description.ilike.%hybrid%,tags.cs.{"hybrid"}')
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching hybrid jobs:", error);
      setLoading(false);
      return;
    }

    // ✅ Sort client-side: promotion_tag priority, then newest
    const sorted = (data || []).sort((a, b) => {
      const rankDiff = getTagRank(a.promotion_tag) - getTagRank(b.promotion_tag);
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setAllHybridJobs(sorted);
    
    // Load initial batch for display
    if (sorted.length > 0) {
      const initialBatch = sorted.slice(0, INITIAL_LOAD_SIZE);
      setDisplayedJobs(initialBatch);
      setCurrentIndex(INITIAL_LOAD_SIZE);
      setHasMore(sorted.length > INITIAL_LOAD_SIZE);
    } else {
      setHasMore(false);
    }
    
    setLoading(false);
  };

  // Load more jobs for infinite scroll
  const loadMoreJobs = useCallback(async () => {
    if (isFetching || !hasMore) return;

    setIsFetching(true);

    // Get filtered jobs based on current search and category
    const filtered = applyFiltersLogic(allHybridJobs, search, activeCategory);
    
    if (currentIndex >= filtered.length) {
      // Reached end of current filtered list, start continuous loop
      if (filtered.length > 0) {
        // Reset to beginning for continuous effect
        setTimeout(() => {
          const newBatch = filtered.slice(0, CONTINUOUS_LOAD_SIZE);
          setDisplayedJobs(newBatch);
          setCurrentIndex(CONTINUOUS_LOAD_SIZE);
          setHasMore(true);
          setAllJobsLoaded(true);
        }, 500);
      }
    } else {
      // Load next batch from current filtered list
      const nextBatch = filtered.slice(currentIndex, currentIndex + CONTINUOUS_LOAD_SIZE);
      setDisplayedJobs(prev => [...prev, ...nextBatch]);
      setCurrentIndex(prev => prev + CONTINUOUS_LOAD_SIZE);
      setHasMore(currentIndex + CONTINUOUS_LOAD_SIZE < filtered.length);
    }

    setIsFetching(false);
  }, [currentIndex, hasMore, isFetching, allHybridJobs, search, activeCategory]);

  // Main filtering logic
  const applyFiltersLogic = (allJobs, query, category) => {
    let filtered = allJobs;

    // General search
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter((job) =>
        [job.title, job.description, job.tags?.join(' ')].some(
          field => field && field.toLowerCase().includes(q)
        )
      );
    }

    // Category filter
    if (category !== "All") {
      filtered = filtered.filter((job) => {
        const searchableText = `${job.title} ${job.description} ${job.tags?.join(' ')}`.toLowerCase();
        return searchableText.includes(category.toLowerCase());
      });
    }

    return filtered;
  };

  // Apply filters and reset display
  const applyFilters = (allJobs, query, category) => {
    const filtered = applyFiltersLogic(allJobs, query, category);
    
    // Reset displayed jobs with new filtered results
    const initialBatch = filtered.slice(0, INITIAL_LOAD_SIZE);
    setDisplayedJobs(initialBatch);
    setCurrentIndex(INITIAL_LOAD_SIZE);
    setHasMore(filtered.length > INITIAL_LOAD_SIZE);
    setAllJobsLoaded(false);
  };

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

        {/* Job Cards with Staggered Animation */}
        <div ref={containerRef}>
          {displayedJobs.length === 0 && !loading ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-10 text-sm text-center text-gray-500"
            >
              No hybrid jobs found.
            </motion.p>
          ) : (
            <div className={
              viewMode === "grid"
                ? "grid grid-cols-2 md:grid-cols-3 gap-4"
                : "space-y-4"
            }>
              <AnimatePresence>
                {displayedJobs.map((job, index) => (
                  <motion.div
                    key={`${job.id}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ 
                      duration: 0.5,
                      delay: Math.min(index * 0.05, 0.5),
                      ease: "easeOut"
                    }}
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
          )}
        </div>

        {/* Loading Indicator */}
        {(loading || isFetching) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mt-6"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className="text-sm text-gray-500">
                {isFetching ? "Loading more hybrid jobs..." : "Loading hybrid jobs..."}
              </p>
            </div>
          </motion.div>
        )}

        {/* Infinite Scroll Sentinel */}
        {hasMore && (
          <div ref={observerRef} className="h-10" />
        )}

        {/* Continuous Loop Indicator */}
        {allJobsLoaded && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-6 py-4"
          >
            <div className="animate-pulse inline-flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
              <p className="text-sm text-purple-700 font-medium">
                Continuous scroll enabled • Showing {displayedJobs.length} hybrid jobs
              </p>
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Desktop-only Footer */}
      <div className="hidden md:block mt-20">
        <Footer />
      </div>
    </>
  );
}