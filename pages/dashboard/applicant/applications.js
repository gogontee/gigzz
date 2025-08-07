'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import ApplicantLayout from '../../../components/dashboard/ApplicantLayout';
import JobCard from '../../../components/JobCard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('applications')
        .select('id, created_at, job:job_id (*)') // fetch job via foreign key
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {applications.map((app) => (
              <JobCard key={app.id} job={app.job} viewMode="list" />
            ))}
          </div>
        )}
      </div>
    </ApplicantLayout>
  );
}
