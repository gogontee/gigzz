import { useEffect, useState } from "react";
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

  useEffect(() => {
    fetchJobs(0, true); // load first page
  }, [routerQuery]);

  useEffect(() => {
    applyFilters(jobs, searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory, jobs]);

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
    setHasMore(data.length === PAGE_SIZE); // only show "Load More" if full page loaded
    setLoading(false);

    const initialQuery = routerQuery?.query || "";
    const initialCategory = routerQuery?.category || "All Jobs";

    setSearchQuery(initialQuery);
    setSelectedCategory(initialCategory);

    applyFilters(reset ? sorted : [...jobs, ...sorted], initialQuery, initialCategory);
  };

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

        {/* Job Results */}
        {filteredJobs.length === 0 ? (
          <p className="text-gray-500">No jobs found.</p>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} viewMode="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} viewMode="list" />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => fetchJobs(page + 1)}
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded-full hover:bg-orange-600 transition disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
