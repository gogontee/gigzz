'use client';
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../../utils/supabaseClient";
import MobileHeader from "../../../components/MobileHeader";
  
export default function JobApplicantsPage() {
  const router = useRouter();
  const { id } = router.query; // job id from URL

  const [applicants, setApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchApplicants = async () => {
      setLoading(true);

      // 1️⃣ Fetch applications for this job
      const { data: applications, error: appsError } = await supabase
        .from("applications")
        .select("id, applicant_id, cover_letter, amount, links, attachment")
        .eq("job_id", id);

      if (appsError) {
        console.error("❌ Error fetching applications:", appsError);
        setApplicants([]);
        setLoading(false);
        return;
      }

      if (!applications || applications.length === 0) {
        setApplicants([]);
        setLoading(false);
        return;
      }

      // 2️⃣ Get all applicant IDs
      const applicantIds = applications.map((a) => a.applicant_id);

      // 3️⃣ Fetch their profiles from applicants table
      const { data: profiles, error: profError } = await supabase
        .from("applicants")
        .select("id, full_name, email, avatar_url")
        .in("id", applicantIds);

      if (profError) {
        console.error("❌ Error fetching profiles:", profError);
        setApplicants([]);
        setLoading(false);
        return;
      }

      // 4️⃣ Merge applications with applicant profiles
      const merged = applications.map((app) => {
        const profile = profiles.find((p) => p.id === app.applicant_id);
        return { ...app, profile }; // profile can be null if not found
      });

      setApplicants(merged);
      if (merged.length > 0) setSelectedApplicant(merged[0]);
      setLoading(false);
    };

    fetchApplicants();
  }, [id]);

  if (loading) {
    return <p className="p-6 text-center">Loading applicants...</p>;
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="sm:hidden">
        <MobileHeader />
      </div>

      {/* Desktop Page Title with enough padding below header */}
      <div className="hidden sm:block pt-24 px-6">
        <h1 className="text-2xl font-bold">Job Applicants</h1>
      </div>

      <div className="flex flex-row h-screen pt-4 sm:pt-6">
        {/* Sidebar */}
        <div className="w-20 sm:w-1/4 md:w-1/5 border-r bg-gray-50 overflow-y-auto">
          <h2 className="hidden sm:block p-4 font-semibold text-lg border-b">
            Applicants
          </h2>
          <ul>
            {applicants.map((app) => {
              const firstName = app.profile?.full_name
                ? app.profile.full_name.split(" ")[0]
                : "Unknown";

              return (
                <li
                  key={app.id}
                  onClick={() => setSelectedApplicant(app)}
                  className={`flex flex-col sm:flex-row sm:items-center sm:gap-3 p-2 cursor-pointer hover:bg-gray-100 transition ${
                    selectedApplicant?.id === app.id ? "bg-gray-200 font-semibold" : ""
                  }`}
                >
                  <img
                    src={app.profile?.avatar_url || "/default-avatar.png"}
                    alt={app.profile?.full_name || "Applicant"}
                    className="w-10 h-10 sm:w-10 sm:h-10 rounded-full object-cover mx-auto sm:mx-0"
                  />
                  {/* Mobile: show only first name */}
                  <div className="hidden sm:block truncate">
                    <p className="text-sm truncate">{app.profile?.full_name || "No name"}</p>
                    <p className="text-xs text-gray-500 truncate">{app.profile?.email || ""}</p>
                  </div>
                  <div className="text-center sm:hidden mt-1 text-xs text-gray-700 truncate">
                    {firstName}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {applicants.length === 0 ? (
            <p className="text-center text-gray-500 text-sm sm:text-base">
              No applicants yet
            </p>
          ) : selectedApplicant ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <img
                  src={selectedApplicant.profile?.avatar_url || "/default-avatar.png"}
                  alt={selectedApplicant.profile?.full_name || "Applicant"}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-base sm:text-xl font-bold">
                    {selectedApplicant.profile?.full_name || "Unnamed Creative"}
                  </h2>
                  <p className="text-xs sm:text-gray-600">
                    {selectedApplicant.profile?.email || "No email"}
                  </p>
                  <button
                    onClick={() =>
                      router.push(`/dashboard/profile/${selectedApplicant.applicant_id}`)
                    }
                    className="mt-1 sm:mt-2 bg-black text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm"
                  >
                    View Full Profile
                  </button>
                </div>
              </div>

              {/* Cover Letter */}
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <h3 className="text-sm sm:text-lg font-semibold mb-2">Cover Letter</h3>
                <p className="text-xs sm:text-gray-700 whitespace-pre-line">
                  {selectedApplicant.cover_letter || "No cover letter provided."}
                </p>
              </div>

              {/* Requested Amount */}
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <h3 className="text-sm sm:text-lg font-semibold mb-2">Requested Amount</h3>
                <p className="text-xs sm:text-gray-700">
                  {selectedApplicant.amount
                    ? `₦${selectedApplicant.amount.toLocaleString()}`
                    : "Not specified"}
                </p>
              </div>

              {/* Links */}
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <h3 className="text-sm sm:text-lg font-semibold mb-2">Links</h3>
                {Array.isArray(selectedApplicant.links) && selectedApplicant.links.length > 0 ? (
                  <ul className="list-disc list-inside text-blue-600 space-y-1 text-xs sm:text-base">
                    {selectedApplicant.links.map((link, idx) => (
                      <li key={idx}>
                        <a href={link.trim()} target="_blank" rel="noopener noreferrer">
                          {link.trim()}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-xs sm:text-base">No links provided.</p>
                )}
              </div>

              {/* Attachments */}
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <h3 className="text-sm sm:text-lg font-semibold mb-2">Attachments</h3>
                {Array.isArray(selectedApplicant.attachment) &&
                selectedApplicant.attachment.length > 0 ? (
                  <ul className="list-disc list-inside text-blue-600 space-y-1 text-xs sm:text-base">
                    {selectedApplicant.attachment.map((file, idx) => (
                      <li key={idx}>
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Download Attachment {idx + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-xs sm:text-base">
                    No attachments provided.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-xs sm:text-base">
              Select an applicant to view details.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
