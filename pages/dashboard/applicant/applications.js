'use client';
import { useEffect, useState } from 'react';
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import ApplicantLayout from '../../../components/dashboard/ApplicantLayout';
import JobCard from '../../../components/JobCard';

const supabase = createPagesBrowserClient();

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null); // track which cover letter is expanded

  useEffect(() => {
    const fetchApplications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          created_at,
          cover_letter,
          job:job_id (*)
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error.message);
        setApplications([]);
      } else {
        setApplications(data);
      }
      setLoading(false);
    };

    fetchApplications();
  }, []);

  return (
    <ApplicantLayout>
      <div className="max-w-5xl mx-auto px-4 py-10 md:pt-20 md:pb-10">
        <h1 className="text-2xl font-bold mb-6">📄 Your Applications</h1>

        {loading ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          <p className="text-gray-600">You haven’t applied to any job yet.</p>
        ) : (
          <div className="space-y-8">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-5 border rounded-xl shadow-sm bg-white hover:shadow-md transition"
              >
                {/* Job Card */}
                <JobCard job={app.job} viewMode="list" />

                {/* Cover Letter */}
                {app.cover_letter && (
                  <div className="mt-4 text-gray-700 text-sm leading-relaxed">
                    <h3 className="font-semibold mb-1">Cover Letter:</h3>
                    <p>
                      {expanded === app.id
                        ? app.cover_letter
                        : app.cover_letter.slice(0, 150) +
                          (app.cover_letter.length > 150 ? '...' : '')}
                    </p>
                    {app.cover_letter.length > 150 && (
                      <button
                        onClick={() =>
                          setExpanded(expanded === app.id ? null : app.id)
                        }
                        className="text-orange-600 text-xs mt-1"
                      >
                        {expanded === app.id ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}

                {/* Date */}
                <p className="mt-3 text-xs text-gray-500">
                  Applied on {new Date(app.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ApplicantLayout>
  );
}
