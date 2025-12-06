// components/Settings.js
'use client';

import { useEffect, useState } from 'react';
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from 'next/router';
import { CheckCircle, X, Briefcase, RefreshCw } from 'lucide-react';

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

  // New states for account switching
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [switchLoading, setSwitchLoading] = useState(false);
  const [switchError, setSwitchError] = useState('');
  const [switchSuccess, setSwitchSuccess] = useState('');

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

  // Handle switch to employer account
  const handleSwitchToEmployer = () => {
    setShowSwitchConfirm(true);
  };

  const confirmSwitch = () => {
    setShowSwitchConfirm(false);
    setShowPasswordConfirm(true);
  };

  const cancelSwitch = () => {
    setShowSwitchConfirm(false);
    setShowPasswordConfirm(false);
    setPassword('');
    setSwitchError('');
    setSwitchSuccess('');
  };

  const verifyPasswordAndSwitch = async () => {
    if (!password.trim()) {
      setSwitchError('Please enter your password');
      return;
    }

    setSwitchLoading(true);
    setSwitchError('');
    setSwitchSuccess('');

    try {
      // First, get the current user's email
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setSwitchError('Unable to get user information. Please try again.');
        setSwitchLoading(false);
        return;
      }

      const userEmail = user.email;

      // Verify the password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password,
      });

      if (signInError) {
        setSwitchError('Invalid password. Please try again.');
        setSwitchLoading(false);
        return;
      }

      // Update user role to employer in the users table
      let roleUpdateSuccessful = false;
      
      // Try updating users table first
      const { error: usersUpdateError } = await supabase
        .from('users')
        .update({ role: 'employer' })
        .eq('id', user.id);

      if (!usersUpdateError) {
        roleUpdateSuccessful = true;
      } else {
        console.error('Users table update error:', usersUpdateError);
        
        // Try updating profiles table as fallback
        const { error: profilesUpdateError } = await supabase
          .from('profiles')
          .update({ role: 'employer' })
          .eq('id', user.id);
          
        if (!profilesUpdateError) {
          roleUpdateSuccessful = true;
        } else {
          console.error('Profiles table update error:', profilesUpdateError);
          
          // Try creating an employer record in the employers table
          const { error: createEmployerError } = await supabase
            .from('employers')
            .upsert({
              id: user.id,
              user_id: user.id,
              name: fullName || user.email?.split('@')[0] || 'Employer',
              email: userEmail,
              phone: phone || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
            
          if (!createEmployerError) {
            roleUpdateSuccessful = true;
          }
        }
      }

      if (!roleUpdateSuccessful) {
        setSwitchError('Failed to update account type. Please contact support.');
        setSwitchLoading(false);
        return;
      }

      // Also update the applicants table to mark this account as switched
      if (profile?.id) {
        await supabase
          .from('applicants')
          .update({ 
            account_switched: true,
            switched_at: new Date().toISOString()
          })
          .eq('id', profile.id);
      }

      // Success - show message and prepare for logout
      setSwitchLoading(false);
      setShowPasswordConfirm(false);
      setPassword('');
      setSwitchSuccess('Account switched to employer successfully! Signing out...');
      
      // Sign out after 2 seconds and redirect to login
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push('/auth/login?role=employer');
      }, 2000);

    } catch (err) {
      console.error('Switch error:', err);
      setSwitchError('An unexpected error occurred. Please try again.');
      setSwitchLoading(false);
    }
  };

  if (loading) {
    return <div className="p-10">Loading settings...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 md:pt-20 md:pb-10">
      <h1 className="text-2xl font-bold mb-6">⚙️ Settings</h1>

      {/* Switch Account Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">🔄 Account Type</h2>
            <p className="text-sm text-gray-600 mb-4">You're currently using an Applicant account</p>
          </div>
          <button
            type="button"
            onClick={handleSwitchToEmployer}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg transition"
          >
            <Briefcase size={18} />
            Switch to Employer Account
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Switch to an employer account to list jobs and hire candidates.
        </p>
        
        {/* Success Message */}
        {switchSuccess && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle size={16} />
            <span>{switchSuccess}</span>
          </div>
        )}
      </div>

      {/* Switch Confirmation Modal */}
      {showSwitchConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Briefcase size={20} />
              Switch to Employer Account?
            </h3>
            <p className="text-gray-600 mb-6">
              This will change your account type to Employer. You'll be able to:
            </p>
            <ul className="text-gray-600 mb-6 space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <span>List job openings and post vacancies</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <span>Browse and hire job seekers</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <span>Manage your company profile</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></div>
                <span>You'll lose applicant-specific features</span>
              </li>
            </ul>
            <p className="text-gray-600 mb-6">
              You'll need to verify your password to confirm. After switching, you'll be signed out and redirected to login.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelSwitch}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSwitch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Continue
                <Briefcase size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Confirmation Modal */}
      {showPasswordConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2">Confirm Password</h3>
            <p className="text-gray-600 mb-4">
              Please enter your password to confirm account switch to Employer.
            </p>
            <p className="text-sm text-gray-500 mb-4 bg-yellow-50 p-2 rounded">
              Note: You'll be signed out after switching and redirected to login.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSwitchError('');
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              {switchError && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <X size={14} />
                  {switchError}
                </p>
              )}
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelSwitch}
                disabled={switchLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={verifyPasswordAndSwitch}
                disabled={switchLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {switchLoading ? 'Processing...' : 'Switch to Employer'}
                {!switchLoading && <RefreshCw size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

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