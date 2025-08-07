import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false); // NEW
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true); // Start loading

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setErrorMsg(authError.message);
      setLoading(false); // Stop loading
      return;
    }

    const user = authData.user;

    if (!user) {
      setErrorMsg('Login failed. Please try again.');
      setLoading(false);
      return;
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      setErrorMsg('No account found. Kindly sign up.');
      setLoading(false);
      return;
    }

    const role = userProfile.role;

    if (role === 'applicant') {
      router.push('/dashboard/applicant');
    } else if (role === 'employer') {
      router.push('/dashboard/employer');
    } else {
      setErrorMsg('Invalid user role. Please contact support.');
    }

    setLoading(false); // Done loading (in case of no redirect)
  };

  return (
    <div className="p-6 max-w-md mx-auto mt-12">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <img
          src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars//icon.png"
          alt="Gigzz Logo"
          className="h-14 w-14 object-contain"
        />
      </div>

      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

      {errorMsg && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm text-center">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          className="w-full border px-4 py-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full border px-4 py-2 rounded pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <span
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded transition text-white ${
            loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-black hover:bg-orange-600'
          }`}
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
        <p>
          Forgot password?{' '}
          <a href="/auth/reset" className="text-orange-600 hover:underline">
            Reset here
          </a>
        </p>
        <p>
          Don’t have an account?{' '}
          <a href="/auth/signup" className="text-orange-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
