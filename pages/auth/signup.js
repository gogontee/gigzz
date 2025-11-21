'use client';
import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, MailCheck, AlertCircle } from 'lucide-react';

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
    role: '', // Changed from 'client' to empty string
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

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
    setVerificationSent(false);

    // Add validation for role selection
    if (!form.role) {
      setErrorMsg('Please choose an account type.');
      return;
    }

    if (!agreedToTerms) {
      setErrorMsg('You must agree to the Terms of Service to continue.');
      return;
    }

    if (form.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      // Store photo data if exists
      if (avatarFile) {
        const reader = new FileReader();
        reader.onload = () => {
          const pendingPhotoData = {
            fileData: reader.result,
            fileName: avatarFile.name,
            fileType: avatarFile.type,
          };
          sessionStorage.setItem('pending_photo', JSON.stringify(pendingPhotoData));
        };
        reader.readAsDataURL(avatarFile);
      }

      // Call our custom API
      const response = await fetch('/api/custom-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show the actual error message from API
        throw new Error(result.error || 'Signup failed. Please try again.');
      }

      // Store photo with user ID if we have one
      if (avatarFile && result.userId) {
        const pendingPhoto = sessionStorage.getItem('pending_photo');
        if (pendingPhoto) {
          localStorage.setItem(`pending_photo_${result.userId}`, pendingPhoto);
          sessionStorage.removeItem('pending_photo');
        }
      }

      setVerificationSent(true);
      setSuccessMsg(result.message);

    } catch (err) {
      console.error('Signup error:', err);
      setErrorMsg(err.message);
      sessionStorage.removeItem('pending_photo');
    } finally {
      setLoading(false);
    }
  };

  // If verification was sent, show success message
  if (verificationSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-start bg-white px-4 pt-20 pb-10">
        <div className="mb-8">
          <Image
            src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png"
            alt="Gigzz Logo"
            width={50}
            height={50}
            style={{ width: "auto", height: "auto" }}
            priority
          />
        </div>

        <div className="w-full max-w-md bg-white border rounded-xl shadow p-8 space-y-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <MailCheck className="w-10 h-10 text-green-500" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>

          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              We've sent a verification email to <strong>{form.email}</strong>. 
              Please check your inbox and click the verification link to activate your account.
            </p>
            
            {avatarFile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-blue-800 text-sm font-medium mb-1">Profile Photo:</p>
                    <p className="text-blue-700 text-sm">
                      Your profile photo will be uploaded after email verification.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 text-sm">
                💡 <strong>Can't find the email?</strong> Check your spam folder.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full p-3 rounded-lg bg-black text-white hover:bg-gray-800 transition font-medium"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-white px-4 pt-20 pb-10">
      <div className="mb-8">
        <Image
          src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png"
          alt="Gigzz Logo"
          width={50}
          height={50}
          style={{ width: "auto", height: "auto" }}
          priority
        />
      </div>

      <form onSubmit={handleSignup} className="w-full max-w-md bg-white border rounded-xl shadow p-6 space-y-5">
        <h2 className="text-2xl font-bold text-black text-center">
          Create your Account
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
          placeholder="example@gmail.com"
          required
          value={form.email}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500"
        />

        <PasswordInput value={form.password} onChange={handleChange} />

        <div>
          <label className="block text-sm text-gray-700 mb-2">Profile Picture (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500"
          />
        </div>

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
          <option value="">Choose account type</option>
          <option value="client">I'm a Client</option>
          <option value="creative">I'm a Creative/Applicant</option>
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
            <Link href="/terms" className="text-orange-600 hover:text-black underline">Terms of Service</Link>
          </label>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </p>
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading || !agreedToTerms || !form.role}
          className="w-full p-3 rounded-lg bg-black text-white hover:bg-orange-600 transition disabled:opacity-50 font-medium"
        >
          {loading ? 'Creating Account...' : 'Create my account'}
        </motion.button>

        <div className="text-sm text-center text-gray-600">
          If you have an account, <Link href="/auth/login" className="text-orange-600 hover:text-black font-semibold">login</Link>
        </div>
      </form>
    </div>
  );
}