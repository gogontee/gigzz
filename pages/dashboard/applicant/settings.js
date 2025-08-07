// pages/dashboard/applicant/settings.js
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import ApplicantLayout from '../../../components/dashboard/ApplicantLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ApplicantSettings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenPreference, setTokenPreference] = useState('standard');

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('applicants')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error) {
          setProfile(data);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    // Add update logic here (supabase update)
    alert('Profile updated (this is a stub)');
  };

  const handleTokenSetting = (e) => {
    setTokenPreference(e.target.value);
  };

  if (loading) {
    return <div className="p-10">Loading settings...</div>;
  }

  return (
    <ApplicantLayout>
      <div className="max-w-5xl mx-auto px-4 py-10 md:pt-20 md:pb-10">
        <h1 className="text-2xl font-bold mb-6">⚙️ Settings</h1>

        {/* Profile Info */}
        <form onSubmit={handleProfileUpdate} className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">👤 Profile Information</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              defaultValue={profile?.full_name || ''}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="text"
              defaultValue={profile?.phone || ''}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              defaultValue={profile?.bio || ''}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition"
          >
            Update Profile
          </button>
        </form>

        {/* Token Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">💎 Token Settings</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Preferred Token Plan</label>
            <select
              value={tokenPreference}
              onChange={handleTokenSetting}
              className="w-full border rounded px-3 py-2"
            >
              <option value="standard">Standard (7 Tokens)</option>
              <option value="premium">Premium (20 Tokens)</option>
            </select>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🔐 Security</h2>
          <p className="text-sm text-gray-700 mb-2">Password reset is handled via email.</p>
          <button
            onClick={() => alert('Redirecting to reset password (not implemented)')}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition"
          >
            Reset Password
          </button>
        </div>
      </div>
    </ApplicantLayout>
  );
}
