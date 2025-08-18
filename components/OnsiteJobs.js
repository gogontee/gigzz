import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import JobCard from "./JobCard";
import { FaThLarge, FaList } from "react-icons/fa";

export default function OnsiteJobs() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid"); // grid or list
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Onsite Jobs
  async function fetchOnsiteJobs(initial = false) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("jobs")
        .select("*") // includes price_range
        .eq("category", "Onsite")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      if (initial) {
        setJobs(data || []);
      } else {
        setJobs((prev) => [...prev, ...(data || [])]);
      }

      setHasMore(data && data.length >= limit);
    } catch (err) {
      console.error("Error fetching onsite jobs:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOnsiteJobs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  // Filter jobs based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredJobs(jobs);
    } else {
      const lower = searchTerm.toLowerCase();
      const filtered = jobs.filter(
        (job) =>
          job.title?.toLowerCase().includes(lower) ||
          job.company?.toLowerCase().includes(lower) ||
          job.location?.toLowerCase().includes(lower) ||
          job.description?.toLowerCase().includes(lower) ||
          job.price_range?.toLowerCase().includes(lower) // ✅ allow search by price range
      );
      setFilteredJobs(filtered);
    }
  }, [searchTerm, jobs]);

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
  };

  if (loading && jobs.length === 0) {
    return <p className="text-center py-10">Loading Onsite Jobs...</p>;
  }

  if (!loading && jobs.length === 0) {
    return <p className="text-center py-10">No onsite jobs available.</p>;
  }

  return (
    <div>
      {/* Header: Title + Toggle */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold">Latest Onsite Jobs</h1>
        <div className="flex space-x-2">
          <FaThLarge
            onClick={() => setView("grid")}
            className={`cursor-pointer text-2xl p-2 border rounded ${
              view === "grid" ? "bg-black text-white" : "bg-white text-gray-600"
            }`}
          />
          <FaList
            onClick={() => setView("list")}
            className={`cursor-pointer text-2xl p-2 border rounded ${
              view === "list" ? "bg-black text-white" : "bg-white text-gray-600"
            }`}
          />
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Jobs display */}
      {view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="w-full">
              <JobCard job={job} />
            </div>
          ))}
        </div>
      )}

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
