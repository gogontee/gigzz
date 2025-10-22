'use client';
import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
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

// Helper function to convert file to base64
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

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

    if (!agreedToTerms) {
      setErrorMsg('You must agree to the Terms of Service to continue.');
      return;
    }

    if (form.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    const { email, password, firstName, lastName, role, country, state, city } = form;
    const userRole = role === 'client' ? 'employer' : 'applicant';
    const profileTable = role === 'client' ? 'employers' : 'applicants';

    try {
      // 1️⃣ Convert file to base64 if exists
      let photoData = null;
      if (avatarFile) {
        try {
          photoData = await convertFileToBase64(avatarFile);
        } catch (fileError) {
          setErrorMsg('Failed to process profile picture. Please try again.');
          setLoading(false);
          return;
        }
      }

      // 2️⃣ Sign up user with email confirmation
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            role: userRole,
            has_pending_photo: !!avatarFile, // Flag to track pending upload
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setErrorMsg('An account with this email already exists. Please sign in instead.');
        } else {
          setErrorMsg(signUpError.message || 'Failed to sign up.');
        }
        setLoading(false);
        return;
      }

      if (!authData?.user?.id) {
        setErrorMsg('Failed to create user account.');
        setLoading(false);
        return;
      }

      const userId = authData.user.id;
      const fullName = `${firstName} ${lastName}`;

      // 3️⃣ Store photo data locally for later upload
      if (avatarFile && photoData) {
        const pendingPhotoData = {
          fileData: photoData,
          fileName: avatarFile.name,
          fileType: avatarFile.type,
          folder: role === 'client' ? 'clients_profile' : 'talents_profile'
        };
        
        localStorage.setItem(`pending_photo_${userId}`, JSON.stringify(pendingPhotoData));
      }

      // 4️⃣ Upsert into users table
      const { error: userTableError } = await supabase.from('users').upsert(
        [{ id: userId, role: userRole }],
        { onConflict: ['id'] }
      );
      if (userTableError) {
        setErrorMsg('Failed to assign user role.');
        setLoading(false);
        return;
      }

      // 5️⃣ Insert into profile table WITHOUT avatar_url initially
      let profilePayload;
      if (userRole === 'applicant') {
        profilePayload = {
          id: userId,
          full_name: fullName,
          email,
          phone: '',
          full_address: '',
          avatar_url: null, // Will be updated after email confirmation
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
          avatar_url: null, // Will be updated after email confirmation
          bio: '',
          id_card_url: null,
        };
      }

      const { error: profileError } = await supabase.from(profileTable).insert([profilePayload]);
      if (profileError) {
        console.error(profileError);
        setErrorMsg('Database error: ' + profileError.message);
        setLoading(false);
        return;
      }

      // Success - show verification message
      setVerificationSent(true);
      setSuccessMsg(`Verification email sent to ${email}`);

    } catch (err) {
      console.error('Signup error:', err);
      setErrorMsg('An unexpected error occurred. Please try again.');
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
            width={100}
            height={30}
            priority
          />
        </div>

        <div className="w-full max-w-md bg-white border rounded-xl shadow p-8 space-y-6 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <MailCheck className="w-10 h-10 text-green-500" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900">
            Verify Your Email
          </h2>

          {/* Message */}
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
                      Your profile photo will be automatically uploaded after you verify your email and log in for the first time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 text-sm">
                💡 <strong>Can't find the email?</strong> Check your spam folder or request a new verification email from the login page.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full p-3 rounded-lg bg-black text-white hover:bg-gray-800 transition font-medium"
            >
              Go to Login
            </button>
            <button
              onClick={() => {
                setVerificationSent(false);
                setForm({
                  firstName: '',
                  lastName: '',
                  email: '',
                  password: '',
                  country: '',
                  state: '',
                  city: '',
                  role: 'client',
                });
                setAvatarFile(null);
                setAgreedToTerms(false);
              }}
              className="w-full p-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              Sign Up Again
            </button>
          </div>

          {/* Support Info */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact <a href="mailto:support@gigzz.com" className="text-orange-600 hover:underline">support@gigzz.com</a>
            </p>
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
          placeholder="example@gmail.com"
          required
          value={form.email}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500"
        />

        <PasswordInput value={form.password} onChange={handleChange} />

        {/* Profile picture upload */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">
            Profile Picture (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500"
          />
          {avatarFile && (
            <p className="text-xs text-gray-500 mt-1">
              ✓ Photo will be uploaded after email verification
            </p>
          )}
        </div>

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
            <Link href="/terms" className="text-orange-600 hover:text-black underline">Terms of Service</Link>&nbsp;and&nbsp;
            <Link href="/policy" className="text-orange-600 hover:text-black underline">Privacy Policy</Link>.
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
        
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-700 text-sm flex items-center gap-2">
              <MailCheck className="w-4 h-4 flex-shrink-0" />
              {successMsg}
            </p>
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading || !agreedToTerms}
          className="w-full p-3 rounded-lg bg-black text-white hover:bg-orange-600 transition disabled:opacity-50 font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Account...
            </span>
          ) : (
            'Create my account'
          )}
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