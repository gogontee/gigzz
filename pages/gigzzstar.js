// pages/gigzzstars.js
'use client';
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import ProfileCard from "../components/ProfileCard";
import MobileHeader from "../components/MobileHeader";

export default function GigzzStarsPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchApplicants = useCallback(async (pageNumber) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("applicants")
      .select("id") // ✅ only fetch `id` since ProfileCard fetches details itself
      .in("subscription", ["All star", "all star"])
      .order("updated_at", { ascending: false })
      .range(pageNumber * 30, pageNumber * 30 + 29);

    if (error) {
      console.error("❌ Error fetching applicants:", error);
    } else {
      if (!data || data.length < 30) setHasMore(false);

      if (pageNumber === 0) {
        setApplicants(data || []);
      } else {
        setApplicants((prev) => [...prev, ...(data || [])]);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplicants(page);
  }, [page, fetchApplicants]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 &&
        !loading &&
        hasMore
      ) {
        setPage((prev) => prev + 1);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  return (
    <>
      {/* Mobile Header */}
      <div className="sm:hidden">
        <MobileHeader />
      </div>

      <div className="p-6 sm:pt-20">
        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-semibold mb-6 text-center">
          🌟 Meet Our Gigzz Stars
        </h1>

        {/* Applicants Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {applicants.map((app) => (
            <ProfileCard key={app.id} id={app.id} />
          ))}
        </div>

        {/* Loader / Empty / End states */}
        {loading && (
          <p className="text-center mt-6 animate-pulse text-orange-400">
            Loading more stars...
          </p>
        )}

        {!loading && applicants.length === 0 && (
          <p className="text-center mt-6 text-red-500">
            No applicants found with All star subscription.
          </p>
        )}

        {!hasMore && !loading && applicants.length > 0 && (
          <p className="text-center mt-6 text-gray-500">
            ✨ You’ve seen all our stars ✨
          </p>
        )}
      </div>
    </>
  );
}
