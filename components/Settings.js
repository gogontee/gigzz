// components/Settings.js
'use client';

import { useEffect, useState } from 'react';
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from 'next/router';

const supabase = createPagesBrowserClient();

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [showBioPreview, setShowBioPreview] = useState(false);
  const router = useRouter();

  // Function to convert HTML to plain text
  const htmlToPlainText = (html) => {
    if (!html) return '';
    
    // Create a temporary div element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Get the text content, which will be plain text
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // Function to convert plain text to formatted display (with line breaks)
  const formatPlainText = (text) => {
    if (!text) return '';
    
    // Convert line breaks to <br> tags and preserve paragraphs
    return text.split('\n\n').map(paragraph => 
      paragraph.split('\n').join('<br>')
    ).join('</p><p>');
  };

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
          // Convert any existing HTML bio to plain text
          setBio(htmlToPlainText(data.bio || ''));
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

    // Convert plain text bio to simple HTML with paragraphs and line breaks
    const formattedBio = bio ? `<p>${formatPlainText(bio)}</p>` : '';

    const updates = {
      id: user.id, // applicants.id = users.id
      full_name: fullName,
      phone,
      bio: formattedBio,
      updated_at: new Date(),
    };

    const { error } = await supabase
      .from('applicants')
      .upsert(updates, { onConflict: 'id' });

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

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Bio</label>
            <button
              type="button"
              onClick={() => setShowBioPreview(!showBioPreview)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              {showBioPreview ? 'Edit Bio' : 'Preview Bio'}
            </button>
          </div>

          {showBioPreview ? (
            <div className="border rounded p-4 bg-gray-50 min-h-[120px]">
              {bio ? (
                <div 
                  className="text-gray-700 leading-relaxed whitespace-pre-line"
                  style={{ lineHeight: '1.6' }}
                >
                  {bio}
                </div>
              ) : (
                <p className="text-gray-500 italic">No bio content to preview</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full border rounded px-3 py-2 min-h-[120px]"
                rows={6}
                placeholder="Tell others about yourself, your skills, and experience...
                
Use empty lines to separate paragraphs.
                
Your bio will appear exactly as you type it here."
                style={{ whiteSpace: 'pre-wrap' }}
              />
              
              {/* Formatting Help */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800 font-medium mb-2">Formatting Tips:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Press <strong>Enter</strong> for a new line</li>
                  <li>• Use <strong>empty lines</strong> between paragraphs</li>
                  <li>• Your text will appear exactly as you type it</li>
                  <li>• No special formatting codes needed</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update Profile'}
          </button>
          
          {showBioPreview && (
            <button
              type="button"
              onClick={() => setShowBioPreview(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
            >
              Edit Bio
            </button>
          )}
        </div>
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

      {/* Bio Preview Section */}
      {bio && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">👀 Bio Preview</h2>
          <div className="border rounded-lg p-6 bg-gray-50">
            <div 
              className="text-gray-800 leading-relaxed whitespace-pre-line"
              style={{ lineHeight: '1.6' }}
            >
              {bio}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            This is how your bio will appear to others on your profile.
          </p>
        </div>
      )}
    </div>
  );
}