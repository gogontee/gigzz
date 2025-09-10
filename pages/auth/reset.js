import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setStatus('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      setStatus(`❌ ${error.message}`);
    } else {
      setStatus('✅ Password reset link sent. Check your email.');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
      <form onSubmit={handleResetPassword} className="space-y-4">
        <input
          type="email"
          className="w-full border px-4 py-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:bg-orange-600 transition"
        >
          Send Reset Link
        </button>
      </form>

      {status && (
        <p className="mt-4 text-center text-sm text-gray-700">{status}</p>
      )}

      <div className="mt-6 text-center text-sm text-gray-600">
        <a href="/auth/login" className="text-orange-600 hover:underline">
          Back to Login
        </a>
      </div>
    </div>
  );
}
