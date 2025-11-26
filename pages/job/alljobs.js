import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../utils/supabaseClient";
import Header from "../../components/Header";
import MobileHeader from "../../components/MobileHeader";
import Footer from "../../components/Footer";
import JobCard from "../../components/JobCard";
import { List, Grid3x3, Search } from "lucide-react";

// Semantic keywords mapped to each category
const categoryKeywords = {
  "All Jobs": [],
  "Design & Creative": [
    "design",
    "creative",
    "creatives",
    "ui",
    "ux",
    "illustration",
    "photoshop",
    "figma",
  ],
  "Development & IT": [
    "development",
    "developer",
    "frontend",
    "backend",
    "fullstack",
    "software",
    "engineer",
    "it",
    "programmer",
    "devops",
  ],
  "Marketing & Sales": [
    "marketing",
    "sales",
    "seo",
    "advertising",
    "growth",
    "campaign",
    "brand",
    "outreach",
  ],
  "Writing & Translation": [
    "writing",
    "writer",
    "translation",
    "content",
    "copywriting",
    "editing",
    "proofreading",
    "blog",
  ],
  "Customer Support": [
    "customer support",
    "helpdesk",
    "service",
    "support",
    "csr",
    "call center",
  ],
  "Finance & Accounting": [
    "finance",
    "accounting",
    "bookkeeping",
    "budget",
    "tax",
    "financial",
    "audit",
  ],
  "Legal Services": [
    "legal",
    "law",
    "compliance",
    "contract",
    "lawyer",
    "paralegal",
  ],
  Engineering: [
    "engineer",
    "mechanical",
    "electrical",
    "civil",
    "hardware",
    "systems",
  ],
};

const PAGE_SIZE = 30;

export default function AllJobs() {
  const router = useRouter();
  const { query: routerQuery } = router;

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Jobs");
  const [viewMode, setViewMode] = useState("grid");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef(null);
  const lastJobRef = useRef(null);

  useEffect(() => {
    fetchJobs(0, true); // load first page
  }, [routerQuery]);

  useEffect(() => {
    applyFilters(jobs, searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory, jobs]);

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

  // Fetch jobs with pagination
  const fetchJobs = async (pageNumber, reset = false) => {
    setLoading(true);
    const from = pageNumber * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .range(from, to);

    if (error) {
      console.error("Error fetching jobs:", error.message);
      setLoading(false);
      return;
    }

    // ✅ Custom client-side sort to enforce Premium → Gold → Silver → NULL
    const sorted = data.sort((a, b) => {
      const rank = (tag) => {
        if (tag === "Premium") return 1;
        if (tag === "Gold") return 2;
        if (tag === "Silver") return 3;
        return 4; // NULL or anything else
      };
      const rankDiff = rank(a.promotion_tag) - rank(b.promotion_tag);
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    if (reset) {
      setJobs(sorted);
    } else {
      setJobs((prev) => [...prev, ...sorted]);
    }

    setPage(pageNumber);
    setHasMore(data.length === PAGE_SIZE);
    setLoading(false);

    const initialQuery = routerQuery?.query || "";
    const initialCategory = routerQuery?.category || "All Jobs";

    setSearchQuery(initialQuery);
    setSelectedCategory(initialCategory);

    applyFilters(reset ? sorted : [...jobs, ...sorted], initialQuery, initialCategory);
  };

  // Load more jobs for infinite scroll
  const loadMoreJobs = useCallback(async () => {
    if (isFetching || !hasMore) return;

    setIsFetching(true);
    const nextPage = page + 1;

    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .range(from, to);

    if (error) {
      console.error("Error fetching more jobs:", error.message);
      setIsFetching(false);
      return;
    }

    if (data.length > 0) {
      // ✅ Custom client-side sort for new data
      const sorted = data.sort((a, b) => {
        const rank = (tag) => {
          if (tag === "Premium") return 1;
          if (tag === "Gold") return 2;
          if (tag === "Silver") return 3;
          return 4; // NULL or anything else
        };
        const rankDiff = rank(a.promotion_tag) - rank(b.promotion_tag);
        if (rankDiff !== 0) return rankDiff;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setJobs((prev) => [...prev, ...sorted]);
      setPage(nextPage);
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }

    setIsFetching(false);
  }, [page, hasMore, isFetching]);

  // Main filtering function
  const applyFilters = (allJobs, query, category) => {
    let filtered = allJobs;

    // General search
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter((job) =>
        [job.title, job.description, job.category, job.location, job.tags].some(
          (field) => typeof field === "string" && field.toLowerCase().includes(q)
        )
      );
    }

    // Category keyword filter
    if (category !== "All Jobs") {
      const keywords = categoryKeywords[category] || [];
      filtered = filtered.filter((job) => {
        const searchable = `${job.title} ${job.description} ${job.category} ${
          job.tags || ""
        }`.toLowerCase();
        return keywords.some((kw) => searchable.includes(kw));
      });
    }

    setFilteredJobs(filtered);
  };

  // Continuous scroll - when reaching end, start from beginning
  useEffect(() => {
    if (!hasMore && filteredJobs.length > 0 && !isFetching) {
      // Add a small delay before restarting to create seamless loop
      const timer = setTimeout(() => {
        // For continuous effect, we can reset to show all jobs again
        // This creates the infinite scroll illusion
        setHasMore(true);
        setPage(0);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [hasMore, filteredJobs.length, isFetching]);

  return (
    <div>
      {/* Headers */}
      <div className="hidden md:block">
        <Header />
      </div>
      <div className="md:hidden">
        <MobileHeader />
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-10 py-6 md:pt-20 max-w-6xl mx-auto">
        {/* Title + View Toggle */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-extrabold text-black">All Jobs</h1>
          <button
            onClick={() =>
              setViewMode(viewMode === "grid" ? "list" : "grid")
            }
            className="p-2 rounded-full bg-gray-100 hover:bg-orange-100 transition"
          >
            {viewMode === "grid" ? <List size={18} /> : <Grid3x3 size={18} />}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search
            className="absolute left-3 top-2.5 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search jobs..."
            className="w-full py-2 pl-10 pr-3 rounded-lg text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-1 mb-6">
          {Object.keys(categoryKeywords).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-1.5 py-0.5 text-[10px] md:px-4 md:py-1.5 md:text-sm rounded-full border transition ${
                selectedCategory === cat
                  ? "bg-black text-white border-black"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Job Results with Animation */}
        {filteredJobs.length === 0 && !loading ? (
          <p className="text-gray-500">No jobs found.</p>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredJobs.map((job, index) => (
                  <div
                    key={`${job.id}-${index}`}
                    className="animate-fade-in-up"
                    style={{
                      animationDelay: `${(index % 10) * 0.1}s`,
                      animationFillMode: 'both'
                    }}
                    ref={index === filteredJobs.length - 1 ? lastJobRef : null}
                  >
                    <JobCard job={job} viewMode="grid" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job, index) => (
                  <div
                    key={`${job.id}-${index}`}
                    className="animate-fade-in-up"
                    style={{
                      animationDelay: `${(index % 10) * 0.1}s`,
                      animationFillMode: 'both'
                    }}
                    ref={index === filteredJobs.length - 1 ? lastJobRef : null}
                  >
                    <JobCard job={job} viewMode="list" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Loading Indicator */}
        {(loading || isFetching) && (
          <div className="flex justify-center mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* Infinite Scroll Sentinel */}
        {hasMore && (
          <div ref={observerRef} className="h-10" />
        )}

        {/* Continuous Loop Indicator */}
        {!hasMore && filteredJobs.length > 0 && (
          <div className="text-center mt-6 py-4">
            <div className="animate-pulse">
              <p className="text-gray-500 text-sm">
                🎉 All jobs loaded! Loading more...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Add custom CSS for animations */}
      <style jsx global>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}