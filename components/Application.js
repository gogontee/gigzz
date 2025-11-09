// components/Application.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import JobCard from './JobCard';
import Link from 'next/link';
import { Briefcase, FileText, Search } from 'lucide-react';

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
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 md:pt-20">
        <div className="text-center max-w-md mx-auto">
          {/* Icon */}
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            No Applications Yet
          </h2>
          
          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            You haven't applied for any job yet. Start exploring available opportunities and apply to find your perfect gig.
          </p>
          
          {/* Action Buttons - Two Column Grid on Mobile */}
          <div className="grid grid-cols-2 gap-3 md:flex md:flex-row md:gap-4 md:justify-center">
            <Link href="/job/alljobs" className="block">
              <button className="w-full bg-orange-500 text-white px-4 py-3 md:px-8 md:py-3 rounded-lg hover:bg-orange-600 transition font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm md:text-base">
                <Search className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Browse Jobs</span>
                <span className="sm:hidden">Browse</span>
              </button>
            </Link>
            <Link href="/" className="block">
              <button className="w-full border border-gray-300 text-gray-700 px-4 py-3 md:px-8 md:py-3 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2 text-sm md:text-base">
                <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Explore Home</span>
                <span className="sm:hidden">Home</span>
              </button>
            </Link>
          </div>
          
          {/* Additional Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Browse jobs by category, location, or use the search feature to find opportunities that match your skills.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      {/* Header */}
      <div className="text-center mb-8 pt-8 md:pt-20">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-orange-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Your Applications
          </h2>
        </div>
        <p className="text-gray-600">
          You've applied to {applications.length} job{applications.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* List of Applications */}
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-6">
          {applications.map((app) => (
            <div
              key={app.id}
              className="p-6 border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-all duration-300"
            >
              {/* Job Card */}
              <JobCard job={app.job} viewMode="list" />

              {/* Cover Letter Section */}
              {app.cover_letter && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Cover Letter</h3>
                  </div>
                  <div className="text-gray-700 leading-relaxed">
                    <p>
                      {expanded === app.id
                        ? app.cover_letter
                        : app.cover_letter.slice(0, 200) +
                          (app.cover_letter.length > 200 ? '...' : '')}
                    </p>
                    {app.cover_letter.length > 200 && (
                      <button
                        onClick={() =>
                          setExpanded(expanded === app.id ? null : app.id)
                        }
                        className="text-orange-600 hover:text-orange-700 font-medium text-sm mt-2 transition"
                      >
                        {expanded === app.id ? 'Show less' : 'Read full letter'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Application Date */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Applied on {new Date(app.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                
                {/* Status Badge (you can add actual status from your database) */}
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Under Review
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Browsing CTA */}
        <div className="text-center mt-12 mb-8">
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-2xl border border-orange-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Continue Your Job Search
            </h3>
            <p className="text-gray-600 mb-4">
              Found {applications.length} job{applications.length !== 1 ? 's' : ''} interesting? 
              Explore more opportunities that match your skills.
            </p>
            <Link href="/job/alljobs">
              <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition font-medium flex items-center gap-2 mx-auto text-sm md:text-base">
                <Search className="w-4 h-4" />
                Browse More Jobs
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}