'use client';
import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

function PasswordInput({ value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        name="password"
        placeholder="Password (8 or more characters)"
        required
        value={value}
        onChange={onChange}
        className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500 pr-10"
      />
      <div
        className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 hover:text-orange-600"
        onClick={() => setShowPassword(prev => !prev)}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </div>
    </div>
  );
}

export default function Signup() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    country: '',
    state: '',
    city: '',
    role: 'client',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setAvatarFile(e.target.files[0]);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!agreedToTerms) {
      setErrorMsg('You must agree to the Terms of Service to continue.');
      return;
    }

    setLoading(true);
    const { email, password, firstName, lastName, role, country, state, city } = form;

    const userRole = role === 'client' ? 'employer' : 'applicant';
    const profileTable = role === 'client' ? 'employers' : 'applicants';

    // 1️⃣ Sign up user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: userRole } }
    });

    if (signUpError || !authData?.user?.id) {
      setErrorMsg(signUpError?.message || 'Failed to sign up.');
      setLoading(false);
      return;
    }

    const userId = authData.user.id;
    const fullName = `${firstName} ${lastName}`;

    // 2️⃣ Upload profile picture if provided
    let avatarUrl = null;
    if (avatarFile) {
      const folder = role === 'client' ? 'clients_profile' : 'talents_profile';
      const filePath = `${folder}/${userId}-${Date.now()}-${avatarFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('profilephoto')
        .upload(filePath, avatarFile);

      if (uploadError) {
        setErrorMsg(`Image upload failed: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('profilephoto')
        .getPublicUrl(filePath);
      avatarUrl = publicUrlData.publicUrl;
    }

    // 3️⃣ Upsert into users table
    const { error: userTableError } = await supabase.from('users').upsert(
      [{ id: userId, role: userRole }],
      { onConflict: ['id'] }
    );
    if (userTableError) {
      setErrorMsg('Failed to assign user role.');
      setLoading(false);
      return;
    }

    // 4️⃣ Insert into profile table
    let profilePayload;
    if (userRole === 'applicant') {
      profilePayload = {
        id: userId,
        full_name: fullName,
        email,
        phone: '',
        full_address: '',
        avatar_url: avatarUrl,
        bio: '',
        specialties: null,
        country: country || null,
        state: state || null,
        city: city || null,
        tags: [],
      };
    } else {
      profilePayload = {
        id: userId,
        name: fullName,
        company: 'N/A',
        email,
        phone: '',
        full_address: '',
        avatar_url: avatarUrl,
        bio: '',
        id_card_url: null,
      };
    }

    const { error: profileError } = await supabase.from(profileTable).insert([profilePayload]);
    if (profileError) {
      setErrorMsg(`Database error: ${profileError.message}`);
      setLoading(false);
      return;
    }

    setSuccessMsg('Account created successfully!');
    setLoading(false);

    setTimeout(() => router.push('/auth/login'), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-white px-4 pt-20 pb-10">
      <div className="mb-8">
        <Image
          src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png"
          alt="Gigzz Logo"
          width={100}
          height={30}
          priority
        />
      </div>

      <form
        onSubmit={handleSignup}
        className="w-full max-w-md bg-white border rounded-xl shadow p-6 space-y-5"
      >
        <h2 className="text-2xl font-bold text-black text-center">
          Create your {form.role === 'client' ? 'Client' : 'Creative'} Account
        </h2>

        <div className="flex justify-between space-x-2">
          <input
            type="text"
            name="firstName"
            placeholder="First name"
            required
            value={form.firstName}
            onChange={handleChange}
            className="w-1/2 p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last name"
            required
            value={form.lastName}
            onChange={handleChange}
            className="w-1/2 p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500"
          />
        </div>

        <input
          type="email"
          name="email"
          placeholder="Work email address"
          required
          value={form.email}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500"
        />

        <PasswordInput value={form.password} onChange={handleChange} />

        {/* Profile picture upload */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full p-2 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500"
        />

        {/* Country dropdown with datalist */}
        <input
          list="countries"
          type="text"
          name="country"
          placeholder="Country"
          value={form.country}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500"
          required
        />
        <datalist id="countries">
          {[
            "Nigeria","Ghana","Kenya","South Africa","United States","United Kingdom","Canada",
            "Australia","Germany","France","India","China","Brazil","Mexico","Japan","Italy","Spain",
            "Egypt","Ethiopia","Uganda","Tanzania","Cameroon","Senegal","Ivory Coast","Rwanda","Zambia",
            "Zimbabwe","Malawi","Mozambique","South Sudan","Morocco","Tunisia","Algeria","Turkey",
            "Saudi Arabia","United Arab Emirates","Qatar","Russia","Ukraine","Netherlands","Sweden",
            "Norway","Denmark","Switzerland","Belgium","Portugal","Poland","Argentina","Chile",
            "Colombia","Peru","Venezuela","Pakistan","Bangladesh","Philippines","Malaysia","Singapore"
          ].map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <input
          type="text"
          name="state"
          placeholder="State"
          value={form.state}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500"
        />

        <input
          type="text"
          name="city"
          placeholder="City"
          value={form.city}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          required
          className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500"
        >
          <option value="client">I'm a Client</option>
          <option value="creative">I'm a Creative</option>
        </select>

        <div className="flex items-start space-x-2 text-sm">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={e => setAgreedToTerms(e.target.checked)}
            className="mt-1 accent-orange-600"
            required
          />
          <label className="text-gray-700">
            Yes, I understand and agree to Gigzz&nbsp;
            <Link href="/terms" className="text-orange-600 hover:text-black underline">Terms of Service</Link>, including the&nbsp;
            <Link href="/user-agreement" className="text-orange-600 hover:text-black underline">User Agreement</Link>&nbsp;and&nbsp;
            <Link href="/privacy-policy" className="text-orange-600 hover:text-black underline">Privacy Policy</Link>.
          </label>
        </div>

        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}
        {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading || !agreedToTerms}
          className="w-full p-3 rounded-lg bg-black text-white hover:bg-orange-600 transition disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create my account'}
        </motion.button>

        <div className="text-sm text-center text-gray-600">
          If you have an account,&nbsp;
          <Link href="/auth/login" className="text-orange-600 hover:text-black font-semibold">login</Link>
        </div>

        <div className="text-sm text-center">
          <Link href="/auth/reset" className="text-gray-600 hover:text-orange-600 underline">Forgot password? Reset</Link>
        </div>
      </form>
    </div>
  );
}
