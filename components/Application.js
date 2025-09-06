// components/Application.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import JobCard from './JobCard';

export default function Application({ userId }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      let authUserId = userId;

      if (!authUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        authUserId = user?.id;
      }

      if (!authUserId) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('applications')
        .select(
          `
          id,
          created_at,
          cover_letter,
          job:job_id (*)
        `
        )
        .eq('applicant_id', authUserId)
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
  }, [userId]);

  if (loading) {
    return <p className="text-center text-gray-500">Loading applications...</p>;
  }

  if (applications.length === 0) {
    return <p className="text-center text-gray-600">You haven’t applied to any job yet.</p>;
  }

  return (
    <div className="px-4">
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900 pt-8 md:pt-20 mb-6">
        Your Applications
      </h2>

      {/* Grid of Applications */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {applications.map((app) => (
          <div
            key={app.id}
            className="p-1 sm:p-5 border rounded-xl shadow-sm bg-white hover:shadow-md transition"
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
    </div>
  );
}
