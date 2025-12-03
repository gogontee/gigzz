import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../utils/supabaseClient";
import Header from "../../components/Header";
import MobileHeader from "../../components/MobileHeader";
import Footer from "../../components/Footer";
import JobCard from "../../components/JobCard";
import { List, Grid3x3, Search } from "lucide-react";

// Industry to job_industry field mapping with variations
const industryToJobIndustry = {
  "Design & Creatives": ["design & creatives", "design & creative", "design and creatives", "design and creative"],
  "Tech": ["tech", "technology", "tech industry"],
  "Marketing & Sales": ["marketing & sales", "marketing and sales"],
  "Writing & Translation": ["writing & translation", "writing and translation"],
  "Customer Support": ["customer support"],
  "Finance & Accounting": ["finance & accounting", "finance and accounting"],
  "Fashion": ["fashion"],
  "Entertainment": ["entertainment"],
  "Legal Services": ["legal services"],
  "Construction": ["construction"],
  "Advertising": ["advertising"],
  "Hospitality": ["hospitality"],
  "Transportation": ["transportation"],
  "Others": ["others", "other", "miscellaneous"]
};

const PAGE_SIZE = 30;
const MIN_JOBS_FOR_INFINITE_SCROLL = 10;

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
    // Only enable infinite scroll if we have filtered jobs >= MIN_JOBS_FOR_INFINITE_SCROLL
    if (filteredJobs.length < MIN_JOBS_FOR_INFINITE_SCROLL) {
      return;
    }

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
  }, [hasMore, loading, isFetching, filteredJobs.length]);

  // Fetch jobs with pagination
  const fetchJobs = async (pageNumber, reset = false) => {
    setLoading(true);
    const from = pageNumber * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Build base query
    let query = supabase
      .from("jobs")
      .select("*")
      .range(from, to);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching jobs:", error.message);
      setLoading(false);
      return;
    }

    // Log some sample job_industry values to debug
    console.log("Sample job_industry values:", data.slice(0, 5).map(job => job.job_industry));

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
    // Don't load more if filtered jobs are less than minimum required
    if (isFetching || !hasMore || filteredJobs.length < MIN_JOBS_FOR_INFINITE_SCROLL) return;

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
  }, [page, hasMore, isFetching, filteredJobs.length]);

  // Helper function to extract tags from job
  const getJobTags = (job) => {
    if (Array.isArray(job.tags)) {
      return job.tags.join(' ').toLowerCase();
    } else if (typeof job.tags === 'string') {
      return job.tags.toLowerCase();
    }
    return '';
  };

  // Check if job matches search query by word
  const matchesSearchQuery = (job, query) => {
    if (!query.trim()) return true;
    
    const q = query.toLowerCase().trim();
    const queryWords = q.split(' ').filter(word => word.length > 0);
    
    // Check job tags field for matches
    const jobTags = getJobTags(job);
    if (jobTags) {
      // Check for exact phrase match in tags
      if (jobTags.includes(q)) {
        return true;
      }
      
      // Check for any individual word match in tags
      if (queryWords.some(word => jobTags.includes(word))) {
        return true;
      }
    }
    
    // Check job title for matches
    if (job.title) {
      const jobTitleLower = job.title.toLowerCase();
      
      // Check for exact phrase match in title
      if (jobTitleLower.includes(q)) {
        return true;
      }
      
      // Check for any individual word match in title
      if (queryWords.some(word => jobTitleLower.includes(word))) {
        return true;
      }
    }
    
    return false;
  };

  // Check if job matches category (case-insensitive job_industry match)
  const matchesCategory = (job, category) => {
    if (category === "All Jobs") return true;
    
    const expectedIndustries = industryToJobIndustry[category];
    if (!expectedIndustries || !Array.isArray(expectedIndustries)) return false;
    
    // Check if job_industry matches any of the expected values (case-insensitive)
    if (job.job_industry) {
      const jobIndustryLower = job.job_industry.toLowerCase().trim();
      
      for (const expectedIndustry of expectedIndustries) {
        if (jobIndustryLower === expectedIndustry.toLowerCase()) {
          return true;
        }
      }
      
      // Also check for partial matches for common variations
      if (category === "Design & Creatives") {
        if (jobIndustryLower.includes("design") && jobIndustryLower.includes("creative")) {
          return true;
        }
      } else if (category === "Marketing & Sales") {
        if (jobIndustryLower.includes("marketing") && jobIndustryLower.includes("sales")) {
          return true;
        }
      } else if (category === "Writing & Translation") {
        if (jobIndustryLower.includes("writing") && jobIndustryLower.includes("translation")) {
          return true;
        }
      } else if (category === "Finance & Accounting") {
        if (jobIndustryLower.includes("finance") && jobIndustryLower.includes("accounting")) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Main filtering function
  const applyFilters = (allJobs, query, category) => {
    let filtered = allJobs;

    // Filter by category (exact job_industry match)
    if (category !== "All Jobs") {
      filtered = filtered.filter(job => matchesCategory(job, category));
    }

    // Filter by search query (checks tags and title)
    if (query.trim()) {
      filtered = filtered.filter(job => matchesSearchQuery(job, query));
    }

    setFilteredJobs(filtered);
  };

  // Handle category click
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    applyFilters(jobs, searchQuery, category);
  };

  // Check if we should show footer (only if filtered jobs are less than 10)
  const shouldShowFooter = filteredJobs.length < MIN_JOBS_FOR_INFINITE_SCROLL;

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
          <h1 className="text-2xl font-extrabold text-black">
            {selectedCategory === "All Jobs" ? "All Jobs" : `${selectedCategory} Jobs`}
            {filteredJobs.length > 0 && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'})
              </span>
            )}
          </h1>
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
            placeholder="Search jobs by tags or job title..."
            className="w-full py-2 pl-10 pr-3 rounded-lg text-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Search by job tags or job title only
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-1 mb-6">
          {["All Jobs", ...Object.keys(industryToJobIndustry)].map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
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

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700 text-center">
              Debug: {jobs.length} total jobs loaded | Sample industries: {
                Array.from(new Set(jobs.slice(0, 10).map(j => j.job_industry).filter(Boolean))).join(', ')
              }
            </p>
          </div>
        )}

        {/* Filter Info */}
        {(selectedCategory !== "All Jobs" || searchQuery) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 text-center">
              {selectedCategory !== "All Jobs" && (
                <>
                  🔍 Showing jobs in <span className="font-semibold">{selectedCategory}</span> industry
                  {searchQuery && " and "}
                </>
              )}
              {searchQuery && (
                <>
                  🔍 Searching for: <span className="font-semibold">"{searchQuery}"</span>
                  <span className="block text-xs mt-1">
                    (Searching in job tags and job title only)
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Job Results with Animation */}
        {filteredJobs.length === 0 && !loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg mb-2">
              {searchQuery 
                ? `No jobs found for "${searchQuery}". Try different keywords.`
                : `No jobs found in ${selectedCategory} industry`
              }
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All Jobs");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              View All Jobs
            </button>
          </div>
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

        {/* Infinite Scroll Sentinel - Only show if filtered jobs >= MIN_JOBS_FOR_INFINITE_SCROLL */}
        {hasMore && filteredJobs.length >= MIN_JOBS_FOR_INFINITE_SCROLL && (
          <div ref={observerRef} className="h-10" />
        )}

        {/* Continuous Loop Indicator - Only show if filtered jobs >= MIN_JOBS_FOR_INFINITE_SCROLL */}
        {!hasMore && filteredJobs.length > 0 && filteredJobs.length >= MIN_JOBS_FOR_INFINITE_SCROLL && (
          <div className="text-center mt-6 py-4">
            <div className="animate-pulse">
              <p className="text-gray-500 text-sm">
                🎉 All jobs loaded! Loading more...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Only show if filtered jobs are less than MIN_JOBS_FOR_INFINITE_SCROLL */}
      {shouldShowFooter && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}

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