'use client';
import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, X } from 'lucide-react';
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

  // Upload file to Supabase storage under clients_asset/
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

      // If user selected new avatar
      if (avatarFile) {
        try {
          avatar_url = await uploadToStorage(avatarFile, employer.id);
        } catch (uploadErr) {
          setStatusMsg({ type: 'error', text: 'Avatar upload failed. Check storage policies.' });
          setLoading(false);
          return;
        }
      }

      // Build only fields that were filled (skip empty strings)
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

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Avatar */}
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
