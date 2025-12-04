// components/AllJobs.js
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "../utils/supabaseClient"; // ✅ import from utils
import JobCard from "./JobCard";
import { Search } from "lucide-react";

/* categoryKeywords */
const categoryKeywords = {
  "All Jobs": [],
  "Design & Creative": [
    "design","creative","creatives","ui","ux","illustration","photoshop","figma"
  ],
  "Development & IT": [
    "development","developer","frontend","backend","fullstack","software",
    "engineer","it","programmer","devops"
  ],
  "Marketing & Sales": [
    "marketing","sales","seo","advertising","growth","campaign","brand","outreach"
  ],
  "Writing & Translation": [
    "writing","writer","translation","content","copywriting","editing","proofreading","blog"
  ],
  "Customer Support": ["customer support","helpdesk","service","support","csr","call center"],
  "Finance & Accounting": ["finance","accounting","bookkeeping","budget","tax","financial","audit"],
  "Legal Services": ["legal","law","compliance","contract","lawyer","paralegal"],
  Engineering: ["engineer","mechanical","electrical","civil","hardware","systems"],
};

const PAGE_SIZE = 30;

// ranking helper (normalize tag, return numeric rank)
const rankFor = (tag) => {
  const t = (tag || "").toString().toLowerCase().trim();
  if (t === "premium") return 1;
  if (t === "gold") return 2;
  if (t === "silver") return 3;
  return 4; // null / other / unknown
};

// comparator: rank first, then created_at desc
const compareByRankAndDate = (a, b) => {
  const r = rankFor(a.promotion_tag) - rankFor(b.promotion_tag);
  if (r !== 0) return r;
  return new Date(b.created_at) - new Date(a.created_at);
};

export default function AllJobs() {
  const router = useRouter();
  const { query: routerQuery } = router;

  const user = useUser();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Jobs");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const searchTimerRef = useRef(null);
  const floatTimerRef = useRef(null);

  // ---------- Activity recorder ----------
  const recordActivity = useCallback(
    async ({ action, query = null, job_id = null, meta = null }) => {
      try {
        if (!user?.id) return;
        const payload = { user_id: user.id, action, query, job_id, meta };
        const { error } = await supabase.from("user_activity").insert([payload]);
        if (error) console.error("Failed to insert user_activity:", error);
      } catch (err) {
        console.error("recordActivity error:", err);
      }
    },
    [supabase, user]
  );
  // ----------------------------------------

  // fetchJobs: retrieves a page, merges with previous pages and re-sorts everything
  const fetchJobs = async (reset = false, pageIndex = 0) => {
    setLoading(true);

    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching jobs:", error);
      setLoading(false);
      return;
    }

    const newPage = data || [];

    setJobs((prevJobs) => {
      const combined = reset ? [...newPage] : [...prevJobs, ...newPage];

      // Remove duplicates by id
      const uniqueMap = new Map();
      for (const j of combined) {
        uniqueMap.set(j.id, j);
      }

      const uniqueList = Array.from(uniqueMap.values());
      uniqueList.sort(compareByRankAndDate); // ✅ enforce sort

      // Apply filters immediately
      applyFilters(uniqueList, searchQuery, selectedCategory);

      setHasMore(newPage.length === PAGE_SIZE);
      setLoading(false);

      return uniqueList;
    });
  };

  useEffect(() => {
    // fresh load on mount or when query params change
    const initialQuery = routerQuery?.query || "";
    const initialCategory = routerQuery?.category || "All Jobs";
    setSearchQuery(initialQuery);
    setSelectedCategory(initialCategory);
    setPage(0);

    fetchJobs(true, 0);
    recordActivity({ action: "visit_jobs_page", query: initialCategory || initialQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerQuery]);

  useEffect(() => {
    applyFilters(jobs, searchQuery, selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, jobs]);

  // applyFilters: filters then sorts
  const applyFilters = (allJobs, query, category) => {
    let filtered = allJobs ? [...allJobs] : [];

    if (query && query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter((job) =>
        [job.title, job.description, job.category, job.location, (job.tags || "")]
          .some((field) => typeof field === "string" && field.toLowerCase().includes(q))
      );
    }

    if (category && category !== "All Jobs") {
      const keywords = categoryKeywords[category] || [];
      filtered = filtered.filter((job) => {
        const searchable = `${job.title} ${job.description} ${job.category} ${(job.tags || "")}`.toLowerCase();
        return keywords.some((kw) => searchable.includes(kw));
      });
    }

    filtered.sort(compareByRankAndDate); // ✅ enforce sort

    setFilteredJobs(filtered);
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      recordActivity({ action: "search", query: q });
    }, 700);
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    recordActivity({ action: "select_category", query: cat });
  };

  const handleJobClick = (job) => {
    recordActivity({ action: "click_job", job_id: job.id, query: searchQuery || selectedCategory });
    router.push(`/job/${job.id}`);
  };

  const handleViewAllJobs = () => {
    // Navigate to the all jobs page with current filters as query params
    const queryParams = new URLSearchParams();
    if (searchQuery) queryParams.append('query', searchQuery);
    if (selectedCategory && selectedCategory !== 'All Jobs') queryParams.append('category', selectedCategory);
    
    router.push(`/job/alljobs?${queryParams.toString()}`);
  };

  return (
    <div className="px-4 md:px-10">
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search jobs..."
            className="w-full border border-gray-300 rounded-full py-2 pl-10 pr-4 text-sm"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(categoryKeywords).map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-2 py-0.5 text-[0.65rem] md:px-4 md:py-1.5 md:text-sm rounded-full border transition ${
              selectedCategory === cat
                ? "bg-black text-white border-black"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Job Results */}
      {filteredJobs.length === 0 ? (
        <p className="text-gray-500">No jobs found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="cursor-pointer" onClick={() => handleJobClick(job)}>
              <JobCard job={job} viewMode="grid" />
            </div>
          ))}
        </div>
      )}

      {/* View All Jobs Button with Floating Effect */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleViewAllJobs}
            className="px-6 py-3 bg-black text-white rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 animate-float"
          >
            View All Jobs
            <svg 
              className="inline-block ml-2 w-4 h-4 animate-bounce" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </button>
        </div>
      )}

      {/* Add floating animation styles */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          }
          50% {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
          }
          100% {
            transform: translateY(0px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1), 0 0 0 rgba(255, 107, 0, 0);
          }
          50% {
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1), 0 0 20px rgba(255, 107, 0, 0.3);
          }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}