// pages/gigzzstars.js
"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import ProfileCard from "../components/ProfileCard";
import MobileHeader from "../components/MobileHeader";
import Portfolio from "../components/Portfolios"; // ✅ Import Portfolio component

export default function GigzzStarsPage() {
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMoreApplicants, setHasMoreApplicants] = useState(true);

  // Toggle state
  const [activeTab, setActiveTab] = useState("stars"); // "stars" | "portfolios"

  /** Fetch Applicants (All star) */
  const fetchApplicants = useCallback(async (pageNumber) => {
    setLoadingApplicants(true);

    const { data, error } = await supabase
      .from("applicants")
      .select("id")
      .in("subscription", ["All star", "all star"])
      .order("updated_at", { ascending: false })
      .range(pageNumber * 30, pageNumber * 30 + 29);

    if (error) {
      console.error("❌ Error fetching applicants:", error);
    } else {
      if (!data || data.length < 30) setHasMoreApplicants(false);

      if (pageNumber === 0) {
        setApplicants(data || []);
      } else {
        setApplicants((prev) => [...prev, ...(data || [])]);
      }
    }

    setLoadingApplicants(false);
  }, []);

  /** Initial load */
  useEffect(() => {
    fetchApplicants(page);
  }, [page, fetchApplicants]);

  /** Infinite scroll for applicants */
  useEffect(() => {
    if (activeTab !== "stars") return;

    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 &&
        !loadingApplicants &&
        hasMoreApplicants
      ) {
        setPage((prev) => prev + 1);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab, loadingApplicants, hasMoreApplicants]);

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

        {/* Tabs */}
        <div className="flex justify-center mb-6 space-x-4">
          <button
            onClick={() => setActiveTab("stars")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "stars"
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Top Applicants
          </button>
          <button
            onClick={() => setActiveTab("portfolios")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "portfolios"
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Premium Portfolios
          </button>
        </div>

        {/* Applicants Grid */}
        {activeTab === "stars" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {applicants.map((app) => (
                <ProfileCard key={app.id} id={app.id} />
              ))}
            </div>

            {loadingApplicants && (
              <p className="text-center mt-6 animate-pulse text-orange-400">
                Loading more stars...
              </p>
            )}
            {!loadingApplicants && applicants.length === 0 && (
              <p className="text-center mt-6 text-red-500">
                No applicants found with All star subscription.
              </p>
            )}
            {!hasMoreApplicants && !loadingApplicants && applicants.length > 0 && (
              <p className="text-center mt-6 text-gray-500">
                ✨ You’ve seen all our stars ✨
              </p>
            )}
          </>
        )}

        {/* Premium Portfolios */}
        {activeTab === "portfolios" && (
          <div>
            <Portfolio /> {/* ✅ Render Portfolio component directly */}
          </div>
        )}
      </div>
    </>
  );
}
