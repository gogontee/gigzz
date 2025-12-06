'use client';
import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, X, User, RefreshCw } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

export default function EmployerProfileEditor({ employer, onUpdated }) {
  const [form, setForm] = useState({
    name: '',
    company: '',
    phone: '',
    full_address: '',
    bio: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  
  // New states for account switching
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [switchLoading, setSwitchLoading] = useState(false);
  const [switchError, setSwitchError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (!employer) return;
    setForm({
      name: employer.name || '',
      company: employer.company || '',
      phone: employer.phone || '',
      full_address: employer.full_address || '',
      bio: employer.bio || '',
    });
    setPreviewAvatar(employer.avatar_url || '');
    
    // Get current user ID
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, [employer]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setPreviewAvatar(URL.createObjectURL(file));
  };

  const uploadToStorage = async (file, employerId) => {
    const ext = file.name.split('.').pop();
    const fileName = `${employerId}-${Date.now()}.${ext}`;
    const filePath = `clients_asset/${fileName}`;

    const { error: uploadErr } = await supabase.storage
      .from('assets')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadErr) {
      console.error('Upload error:', uploadErr);
      throw uploadErr;
    }

    const { data } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employer?.id) return;

    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      let avatar_url = employer.avatar_url || null;

      if (avatarFile) {
        try {
          avatar_url = await uploadToStorage(avatarFile, employer.id);
        } catch (uploadErr) {
          setStatusMsg({ type: 'error', text: 'Avatar upload failed. Check storage policies.' });
          setLoading(false);
          return;
        }
      }

      const updateData = {};
      if (form.name.trim()) updateData.name = form.name;
      if (form.company.trim()) updateData.company = form.company;
      if (form.phone.trim()) updateData.phone = form.phone;
      if (form.full_address.trim()) updateData.full_address = form.full_address;
      if (form.bio.trim()) updateData.bio = form.bio;
      if (avatarFile) updateData.avatar_url = avatar_url;

      if (Object.keys(updateData).length === 0) {
        setStatusMsg({ type: 'error', text: 'No changes to update.' });
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('employers')
        .update(updateData)
        .eq('id', employer.id);

      if (updateError) {
        console.error(updateError);
        setStatusMsg({ type: 'error', text: 'Failed to save profile.' });
      } else {
        setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
        onUpdated?.();
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Unexpected error. Try again.' });
    }

    setLoading(false);
  };

  // Handle switch to applicant account
  const handleSwitchToApplicant = () => {
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
  };

  const verifyPasswordAndSwitch = async () => {
    if (!password.trim()) {
      setSwitchError('Please enter your password');
      return;
    }

    setSwitchLoading(true);
    setSwitchError('');

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

      // Update user role to applicant in the users table
      // Option 1: If you have a 'users' table
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'applicant' })
        .eq('id', user.id);

      if (updateError) {
        console.error('Role update error:', updateError);
        
        // Option 2: If you have a 'profiles' table instead
        // Try updating profiles table if users table doesn't exist
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'applicant' })
          .eq('id', user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
          
          // Option 3: If you store role in a different table
          // Check if employer has user_id field
          if (employer?.user_id) {
            const { error: employerUserError } = await supabase
              .from('users')
              .update({ role: 'applicant' })
              .eq('id', employer.user_id);
            
            if (employerUserError) {
              console.error('Employer user update error:', employerUserError);
              setSwitchError('Failed to update account type. Please contact support.');
              setSwitchLoading(false);
              return;
            }
          } else {
            setSwitchError('Failed to switch account type. Please contact support.');
            setSwitchLoading(false);
            return;
          }
        }
      }

      // Also update the employers table to mark this account as switched
      if (employer?.id) {
        await supabase
          .from('employers')
          .update({ 
            account_switched: true,
            switched_at: new Date().toISOString()
          })
          .eq('id', employer.id);
      }

      // Success - show message and redirect
      setSwitchLoading(false);
      setShowPasswordConfirm(false);
      setPassword('');
      
      // Show success message
      setStatusMsg({ 
        type: 'success', 
        text: 'Account switched to applicant successfully! Redirecting...' 
      });
      
      // Sign out and redirect to login or applicant dashboard
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/auth/login?role=applicant'; // Redirect to login with role param
      }, 2000);

    } catch (err) {
      console.error('Switch error:', err);
      setSwitchError('An unexpected error occurred. Please try again.');
      setSwitchLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-6">
      {/* Switch Account Section */}
      <div className="border-b pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Account Type</h3>
            <p className="text-sm text-gray-600">You're currently using an Employer account</p>
          </div>
          <button
            type="button"
            onClick={handleSwitchToApplicant}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg transition"
          >
            <User size={18} />
            Switch to Applicant Account
          </button>
        </div>
      </div>

      {/* Switch Confirmation Modal */}
      {showSwitchConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2">Switch to Applicant Account?</h3>
            <p className="text-gray-600 mb-6">
              This will change your account type to Applicant. You'll lose employer-specific features 
              and gain applicant features. You'll need to verify your password to confirm.
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue
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
              Please enter your password to confirm account switch.
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
                {switchLoading ? 'Processing...' : 'Switch Account'}
                {!switchLoading && <RefreshCw size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Editor Content */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="relative flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
            {previewAvatar ? (
              <img
                src={previewAvatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Camera size={28} />
              </div>
            )}
          </div>
          <label className="mt-2 flex items-center gap-1 bg-black text-white px-3 py-1 rounded-full cursor-pointer hover:bg-orange-600 transition text-xs">
            Change Avatar
            <input
              type="file"
              accept="image/png, image/jpeg"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </label>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-1">Profile Details</h2>
          <p className="text-sm text-gray-600">
            Update only the fields you want to change.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Full Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            className="w-full border border-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Company</label>
          <input
            name="company"
            value={form.company}
            onChange={handleChange}
            placeholder="Company or organization"
            className="w-full border border-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Phone Number</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+1 555 555 555"
            className="w-full border border-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Full Address</label>
          <input
            name="full_address"
            value={form.full_address}
            onChange={handleChange}
            placeholder="City, Country"
            className="w-full border border-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="col-span-2 flex flex-col">
          <label className="text-sm font-medium mb-1">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={4}
            placeholder="Short description about you or your company"
            className="w-full border border-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>

        <div className="col-span-2 flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-full hover:bg-orange-600 transition"
          >
            {loading ? 'Saving...' : 'Save Changes'}
            {!loading && <CheckCircle size={16} />}
          </button>
          {statusMsg.text && (
            <div
              className={`text-sm flex items-center gap-1 ${
                statusMsg.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle size={16} />
              ) : (
                <X size={16} />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}