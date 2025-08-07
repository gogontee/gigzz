import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabaseClient';
import ApplicantsLayout from '../../../components/dashboard/ApplicantLayout';

export default function EditApplicantProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    full_address: '',
    bio: '',
    specialties: [],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        setError('Failed to load profile.');
        console.error(error);
      } else {
        setForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          full_address: data.full_address || '',
          bio: data.bio || '',
          specialties: data.specialties || [],
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('applicants')
      .update({
        full_name: form.full_name,
        phone: form.phone,
        full_address: form.full_address,
        bio: form.bio,
        specialties: form.specialties,
      })
      .eq('id', user.id);

    if (error) {
      console.error(error);
      setError('Failed to update profile.');
    } else {
      setSuccess('Profile updated successfully!');
    }

    setLoading(false);
  };

  return (
    <ApplicantsLayout>
      <div className="max-w-xl mx-auto mt-10 bg-white shadow p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Edit Profile</h2>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Full Address</label>
            <input
              type="text"
              name="full_address"
              value={form.full_address}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Specialties (comma-separated)
            </label>
            <input
              type="text"
              name="specialties"
              value={form.specialties.join(', ')}
              onChange={(e) =>
                setForm({
                  ...form,
                  specialties: e.target.value.split(',').map((s) => s.trim()),
                })
              }
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </ApplicantsLayout>
  );
}
