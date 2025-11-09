// pages/dashboard/applicant/settings.js
'use client';
import { useEffect, useState } from 'react';
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from 'next/router';
import ApplicantLayout from '../../../components/dashboard/ApplicantLayout';

const supabase = createPagesBrowserClient();

export default function ApplicantSettings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const router = useRouter();

  // Fetch applicant profile
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('applicants')
          .select('id, full_name, phone, bio')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setProfile(data);
          setFullName(data.full_name || '');
          setPhone(data.phone || '');
          setBio(data.bio || '');
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  // Update applicant profile
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('User not found.');
      setSaving(false);
      return;
    }

    const updates = {
      id: user.id, // important, because applicants.id = users.id
      full_name: fullName,
      phone,
      bio,
      updated_at: new Date(), // optional column, but safe to keep
    };

    const { error } = await supabase
      .from('applicants')
      .upsert(updates, { onConflict: 'id' }); // ensure conflict resolution on PK

    if (error) {
      console.error('Error updating profile:', error.message);
      alert('Failed to update profile: ' + error.message);
    } else {
      alert('Profile updated successfully!');
    }

    setSaving(false);
  };

  const handleResetPassword = () => {
    router.push('/auth/reset');
  };

  if (loading) {
    return <div className="p-10">Loading settings...</div>;
  }

  return (
    <ApplicantLayout>
      <div className="max-w-5xl mx-auto px-4 py-10 md:pt-20 md:pb-10">
        <h1 className="text-2xl font-bold mb-6">⚙️ Settings</h1>

        {/* Profile Info */}
        <form
          onSubmit={handleProfileUpdate}
          className="bg-white rounded-lg shadow p-6 mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">👤 Profile Information</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition"
          >
            {saving ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        {/* Security */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🔐 Security</h2>
          <p className="text-sm text-gray-700 mb-2">
            Password reset is handled via email.
          </p>
          <button
            onClick={handleResetPassword}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition"
          >
            Reset Password
          </button>
        </div>
      </div>
    </ApplicantLayout>
  );
}
