// components/Settings.js
'use client';

import { useEffect, useRef, useState } from 'react';
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from 'next/router';
import {
  CheckCircle,
  X,
  Briefcase,
  RefreshCw,
  User,
  ShieldCheck,
  Camera,
  Upload,
  Loader2,
} from 'lucide-react';

const supabase = createPagesBrowserClient();

const FALLBACK_AVATAR =
  'https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png';

export default function Settings() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile fields
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [company, setCompany] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showBioPreview, setShowBioPreview] = useState(false);

  // Role switching
  const [currentRole, setCurrentRole] = useState(null);     // active_role
  const [primaryRole, setPrimaryRole] = useState(null);     // users.role
  const [availableRoles, setAvailableRoles] = useState([]); // from user_roles
  const [switching, setSwitching] = useState(false);
  const [switchMessage, setSwitchMessage] = useState('');
  const [switchError, setSwitchError] = useState('');

  // 🔔 Avatar feedback
  const [avatarMsg, setAvatarMsg] = useState('');
  const [avatarErr, setAvatarErr] = useState('');

  /* ---------------- Load data ---------------- */
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. users row
      const { data: userRow } = await supabase
        .from('users')
        .select('role, active_role')
        .eq('id', user.id)
        .maybeSingle();

      const active = userRow?.active_role || userRow?.role || 'applicant';
      setCurrentRole(active);
      setPrimaryRole(userRow?.role || 'applicant');

      // 2. roles this user has enabled
      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const roles = (roleRows || []).map((r) => r.role);
      setAvailableRoles(roles);

      // 3. Profile data — depends on current role
      if (active === 'employer') {
        const { data: employerData } = await supabase
          .from('employers')
          .select('id, name, company, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (employerData) {
          setProfile(employerData);
          setFullName(employerData.name || '');
          setCompany(employerData.company || '');
          setAvatarUrl(employerData.avatar_url || '');
        }
      } else {
        // applicant (default)
        const { data: applicantData } = await supabase
          .from('applicants')
          .select('id, full_name, phone, bio, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (applicantData) {
          setProfile(applicantData);
          setFullName(applicantData.full_name || '');
          setPhone(applicantData.phone || '');
          setBio(htmlToPlainText(applicantData.bio || ''));
          setAvatarUrl(applicantData.avatar_url || '');
        }
      }

      setLoading(false);
    };

    load();
  }, []);

  /* ---------------- Bio helpers ---------------- */
  const htmlToPlainText = (html) => {
    if (!html) return '';
    if (typeof document === 'undefined') return html;
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const formatPlainText = (text) => {
    if (!text) return '';
    return text
      .split('\n\n')
      .map((p) => p.split('\n').join('<br>'))
      .join('</p><p>');
  };

  /* ---------------- Save profile ---------------- */
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('User not found.');
      setSaving(false);
      return;
    }

    // Build update object based on active role
    let table;
    let updates;

    if (currentRole === 'employer') {
      table = 'employers';
      updates = {
        id: user.id,
        name: fullName,
        company,
        avatar_url: avatarUrl || null,
        updated_at: new Date(),
      };
    } else {
      table = 'applicants';
      const formattedBio = bio ? `<p>${formatPlainText(bio)}</p>` : '';
      updates = {
        id: user.id,
        full_name: fullName,
        phone,
        bio: formattedBio,
        avatar_url: avatarUrl || null,
        updated_at: new Date(),
      };
    }

    const { error } = await supabase
      .from(table)
      .upsert(updates, { onConflict: 'id' });

    if (error) {
      console.error('Error updating profile:', error.message);
      alert('Failed to update profile: ' + error.message);
    } else {
      alert('Profile updated successfully!');
    }

    setSaving(false);
  };

  /* ---------------- Avatar upload ---------------- */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
      setAvatarErr('Only JPG, PNG, or WEBP allowed.');
      setAvatarMsg('');
      return;
    }

    // Validate size — 5 MB max
    if (file.size > 5 * 1024 * 1024) {
      setAvatarErr('Image must be under 5 MB.');
      setAvatarMsg('');
      return;
    }

    setUploadingAvatar(true);
    setAvatarErr('');
    setAvatarMsg('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}-${Date.now()}.${ext}`;

      // Upload
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;

      // Save to the active role's table
      const table = currentRole === 'employer' ? 'employers' : 'applicants';
      const { error: updateError } = await supabase
        .from(table)
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // ✅ Also mirror to the OTHER table (so switching keeps the avatar)
      const otherTable = currentRole === 'employer' ? 'applicants' : 'employers';
      await supabase
        .from(otherTable)
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      // Silent fail — other row might not exist yet

      setAvatarUrl(publicUrl);
      setAvatarMsg('Avatar updated successfully!');
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setAvatarErr(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingAvatar(false);
      // Reset input so the same file can be reselected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ---------------- Switch role ---------------- */
  const handleSwitchRole = async (targetRole) => {
    setSwitching(true);
    setSwitchError('');
    setSwitchMessage('');

    const { error } = await supabase.rpc('enable_role', {
      p_role: targetRole,
    });

    setSwitching(false);

    if (error) {
      console.error('Switch error:', error);
      setSwitchError(error.message || 'Failed to switch account.');
      return;
    }

    setSwitchMessage(
      `Switched to ${targetRole === 'employer' ? 'Employer' : 'Creative'} account. Redirecting…`
    );

    setTimeout(() => {
      if (targetRole === 'employer') {
        router.push('/dashboard/employer');
      } else {
        router.push('/dashboard/applicant');
      }
    }, 900);
  };

  const handleResetPassword = () => {
    router.push('/auth/reset');
  };

  if (loading) {
    return <div className="p-10">Loading settings...</div>;
  }

  /* ---------------- Render ---------------- */
  const otherRole = currentRole === 'employer' ? 'applicant' : 'employer';
  const otherRoleLabel = otherRole === 'employer' ? 'Employer' : 'Creative';
  const hasOtherRoleEnabled = availableRoles.includes(otherRole);
  const isAdmin = currentRole === 'admin' || primaryRole === 'admin';
  const isEmployer = currentRole === 'employer';

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 md:pt-20 md:pb-10">
      <h1 className="text-2xl font-bold mb-6">⚙️ Settings</h1>

      {/* ------------- Role Section ------------- */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold mb-2">🔄 Account Type</h2>
            <p className="text-sm text-gray-600">
              You're currently using a{' '}
              <span className="font-semibold text-gray-900">
                {currentRole === 'employer'
                  ? 'Employer'
                  : currentRole === 'admin'
                  ? 'Admin'
                  : 'Creative'}
              </span>{' '}
              account.
            </p>
          </div>

          {isAdmin ? (
            <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              <ShieldCheck size={14} />
              Admin — role switching disabled
            </span>
          ) : (
            <button
              type="button"
              disabled={switching}
              onClick={() => handleSwitchRole(otherRole)}
              className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 px-4 py-2 rounded-lg transition"
            >
              {otherRole === 'employer' ? (
                <Briefcase size={18} />
              ) : (
                <User size={18} />
              )}
              {hasOtherRoleEnabled
                ? `Switch to ${otherRoleLabel} Account`
                : `Enable ${otherRoleLabel} Account`}
            </button>
          )}
        </div>

        <p className="text-sm text-gray-500 mt-3">
          {isAdmin
            ? 'Admins manage the platform through the admin panel.'
            : hasOtherRoleEnabled
            ? `You can freely switch between Creative and Employer mode. Your data stays intact.`
            : `Enable ${otherRoleLabel} mode to ${
                otherRole === 'employer'
                  ? 'list jobs and hire candidates'
                  : 'apply to jobs and showcase your portfolio'
              }. You can switch back anytime.`}
        </p>

        {switchMessage && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle size={16} />
            <span>{switchMessage}</span>
          </div>
        )}
        {switchError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <X size={16} />
            <span>{switchError}</span>
          </div>
        )}
      </div>

      {/* ------------- Profile Info ------------- */}
      {profile && (
        <form
          onSubmit={handleProfileUpdate}
          className="bg-white rounded-lg shadow p-6 mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">👤 Profile Information</h2>

          {/* ---------- Avatar Section ---------- */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="relative group">
              <img
                src={avatarUrl || FALLBACK_AVATAR}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-sm"
              />

              {/* Overlay camera button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 disabled:bg-black/50"
                aria-label="Change avatar"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Camera className="w-6 h-6" />
                )}
              </button>

              {/* Always-visible small button on mobile / when not hovering */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="md:hidden absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md hover:bg-orange-600 transition disabled:opacity-50"
                aria-label="Change avatar"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Click avatar to change it
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                JPG, PNG, or WEBP · max 5 MB
              </p>
            </div>

            {/* Avatar feedback */}
            {avatarMsg && (
              <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-xs">
                <CheckCircle size={14} />
                <span>{avatarMsg}</span>
              </div>
            )}
            {avatarErr && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
                <X size={14} />
                <span>{avatarErr}</span>
              </div>
            )}
          </div>

          {/* ---------- Name ---------- */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {isEmployer ? 'Your Name' : 'Full Name'}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* ---------- Company (employer only) ---------- */}
          {isEmployer && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Bright Studios Ltd."
                className="w-full border rounded px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Shown on your public employer profile.
              </p>
            </div>
          )}

          {/* ---------- Applicant-only: Phone + Bio ---------- */}
          {!isEmployer && (
            <>
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
                      placeholder={`Tell others about yourself, your skills, and experience...

Use empty lines to separate paragraphs.

Your bio will appear exactly as you type it here.`}
                      style={{ whiteSpace: 'pre-wrap' }}
                    />

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
            </>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || uploadingAvatar}
              className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Profile'}
            </button>

            {!isEmployer && showBioPreview && (
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
      )}

      {/* ------------- Security ------------- */}
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

      {/* ------------- Bio Preview (applicant only) ------------- */}
      {!isEmployer && bio && (
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