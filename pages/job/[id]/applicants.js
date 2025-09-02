'use client';
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import ProfileCard from "../../../components/ProfileCard"; 
import MobileHeader from "../../../components/MobileHeader"; 

export default function JobApplicantsPage() {
  const router = useRouter();
  const { id } = router.query; // job id from URL

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchApplicants = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("applications") // pivot table
        .select("applicant_id")
        .eq("job_id", id);

      if (error) {
        console.error("❌ Error fetching applicants:", error);
        setApplicants([]);
      } else {
        setApplicants(data || []);
      }

      setLoading(false);
    };

    fetchApplicants();
  }, [id]);

  if (loading) {
    return <p className="p-6 text-center">Loading applicants...</p>;
  }

  if (applicants.length === 0) {
    return <p className="p-6 text-center">No applicants yet</p>;
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="sm:hidden">
        <MobileHeader />
      </div>

      <div className="p-6 sm:pt-20">
        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-semibold mb-6 text-center">
          These are the applicants that have applied to your job
        </h1>

        {/* Applicants Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {applicants.map((app) => (
            <ProfileCard key={app.applicant_id} id={app.applicant_id} />
          ))}
        </div>
      </div>
    </>
  );
}
