'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

const supabase = createPagesBrowserClient();

export default function ApplicantProfile() {
  const params = useParams();
  const { id } = params; // ✅ applicant ID
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchApplicant = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching applicant:", error);
      } else {
        setApplicant(data);
      }
      setLoading(false);
    };

    fetchApplicant();
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!applicant) return <p className="p-6">Applicant not found.</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <img
          src={applicant.avatar_url || '/default-avatar.png'}
          alt={applicant.full_name}
          className="w-20 h-20 rounded-full object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold">{applicant.full_name}</h1>
          <p className="text-gray-600">ID: {applicant.id}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p><strong>Email:</strong> {applicant.email || 'N/A'}</p>
        <p><strong>Phone:</strong> {applicant.phone || 'N/A'}</p>
        <p><strong>Bio:</strong> {applicant.bio || 'No bio provided.'}</p>
      </div>
    </div>
  );
}
