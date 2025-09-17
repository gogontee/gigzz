"use client";
import { useState, useEffect, useCallback } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { Eye } from "lucide-react";

const supabase = createPagesBrowserClient();

export default function Portfolio() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); // pagination
  const [hasMore, setHasMore] = useState(true);
  const limit = 50; // 50 projects per page

  const fetchPremiumProjects = useCallback(
    async (pageNum = 1) => {
      setLoading(true);

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .or('promote.eq.premium,promote.eq.Premium')
        .range((pageNum - 1) * limit, pageNum * limit - 1);

      if (error) {
        console.error('Error fetching premium projects:', error);
      } else if (data) {
        // Randomize order
        const randomized = data.sort(() => Math.random() - 0.5);

        if (pageNum === 1) {
          setProjects(randomized); // replace on first page
        } else {
          setProjects((prev) => [...prev, ...randomized]); // append next pages
        }

        if (data.length < limit) setHasMore(false);
      }

      setLoading(false);
    },
    [limit]
  );

  useEffect(() => {
    fetchPremiumProjects(1);
  }, [fetchPremiumProjects]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;

      if (currentScroll + 100 >= scrollableHeight && hasMore && !loading) {
        setPage((prev) => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading]);

  // Fetch next page
  useEffect(() => {
    if (page === 1) return;
    fetchPremiumProjects(page);
  }, [page, fetchPremiumProjects]);

  const filteredProjects = projects.filter((p) =>
    [p.title, p.profession]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-1 lg:pt-4">
        <h1 className="text-2xl font-bold mb-4">Premium Portfolios</h1>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by title or profession..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border p-2 rounded mb-6"
        />

        {filteredProjects.length === 0 && !loading ? (
          <p>No premium portfolios found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white shadow rounded-xl overflow-hidden hover:shadow-lg transition flex flex-col relative"
              >
                {/* Banner with Eye Icon */}
                {proj.profile && (
                  <div className="relative">
                    <img
                      src={proj.profile}
                      alt={proj.title}
                      className="w-full h-40 object-cover"
                    />
                    <Link href={`/project/${proj.id}`}>
                      <Eye
                        size={24}
                        className="absolute top-2 right-2 text-gray-600 hover:text-orange-600 cursor-pointer bg-white rounded-full p-1 shadow"
                      />
                    </Link>
                  </div>
                )}

                {/* Content */}
                <div className="p-1 flex flex-col flex-1">
                  <h2 className="font-semibold text-lg truncate">{proj.title}</h2>
                  {proj.location && (
                    <p className="text-sm text-gray-500 mt-1">{proj.location}</p>
                  )}
                  {proj.details && (
                    <p className="text-sm text-gray-700 mt-2 hidden lg:block">
                      {proj.details.length > 50
                        ? proj.details.substring(0, 50) + '...'
                        : proj.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && <p className="mt-4 text-center">Loading more portfolios...</p>}
      </div>
    </div>
  );
}
