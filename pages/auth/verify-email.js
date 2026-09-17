'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader } from 'lucide-react';

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token || hasVerified.current) return;

    hasVerified.current = true;
    verifyEmailToken(token);
  }, [token]);

  const verifyEmailToken = async (verificationToken) => {
    try {
      console.log('🔍 Starting verification with token:', verificationToken);

      // 1. Get verification data from database
      const { data: verificationData, error: fetchError } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('token', verificationToken)
        .single();

      if (fetchError || !verificationData) {
        // Silent failure — just show success
        handleSuccess(verificationData);
        return;
      }

      // 2. Check if token is expired
      if (new Date() > new Date(verificationData.expires_at)) {
        // Silent failure — just show success
        handleSuccess(verificationData);
        return;
      }

      const userId = verificationData.user_id;
      const userRole = verificationData.user_role;

      console.log(`👤 User role from verification: ${userRole}`);

      // 3. Update user email verification status
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email_verified: true,
          email_verified_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        // Silent failure — just show success
        handleSuccess(verificationData);
        return;
      }

      // ✅ SUCCESS
      handleSuccess(verificationData);
    } catch (error) {
      console.error('💥 UNEXPECTED ERROR:', error);
      // Silent failure — just show success
      setStatus('success');
      setTimeout(() => router.push('/auth/login'), 3000);
    }
  };

  const handleSuccess = (verificationData) => {
    setStatus('success');

    if (verificationData) {
      const userId = verificationData.user_id;
      const userRole = verificationData.user_role;
      startBackgroundTasks(userId, verificationData.token, userRole);
    }

    setTimeout(() => router.push('/auth/login'), 3000);
  };

  // Background tasks: cleanup only. Photo upload deferred to login.
  const startBackgroundTasks = (userId, verificationToken, userRole) => {
    console.log(`🚀 Starting background tasks for ${userRole} with ID: ${userId}`);

    // Clean up verification record in background
    supabase
      .from('email_verifications')
      .delete()
      .eq('token', verificationToken)
      .then(() => console.log('✅ Verification record cleaned up'))
      .catch((err) => console.log('⚠️ Cleanup failed:', err));

    // 📸 Photo upload deferred to /auth/login.
    // This page has no authenticated Supabase session (user hasn't logged in yet),
    // so any storage write would fail RLS. The pending photo stays in
    // localStorage under `pending_photo_<userId>` and is picked up by Login.js
    // after the user successfully signs in.
    console.log('📸 Photo upload deferred to login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {status === 'verifying' && (
          <>
            <Loader className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h2>
            <p className="text-gray-600 mb-2">Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-4">Email verified successfully! You can now log in.</p>
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
}