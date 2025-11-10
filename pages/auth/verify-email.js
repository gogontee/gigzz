'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link - no token found');
      return;
    }

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

      if (fetchError) {
        console.error('Database error:', fetchError);
        setStatus('error');
        setMessage('Invalid verification link - database error');
        return;
      }

      if (!verificationData) {
        setStatus('error');
        setMessage('Invalid or expired verification link');
        return;
      }

      // 2. Check if token is expired (24 hours)
      if (new Date() > new Date(verificationData.expires_at)) {
        setStatus('error');
        setMessage('Verification link has expired. Please sign up again.');
        return;
      }

      const userId = verificationData.user_id;

      // 3. Update user email verification status in users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ email_verified: true })
        .eq('id', userId);

      if (updateError) {
        console.error('User table update failed:', updateError);
        setStatus('error');
        setMessage('Failed to verify email - database error');
        return;
      }

      // 4. Clean up verification record (don't block on this)
      try {
        await supabase
          .from('email_verifications')
          .delete()
          .eq('token', verificationToken);
      } catch (deleteError) {
        console.log('⚠️ Failed to delete verification record (continuing):', deleteError);
      }

      // 5. Handle pending photo upload if exists
      const pendingPhotoKey = `pending_photo_${userId}`;
      const pendingPhoto = localStorage.getItem(pendingPhotoKey);
      
      if (pendingPhoto) {
        try {
          console.log('📸 Found pending photo, uploading...');
          const photoData = JSON.parse(pendingPhoto);
          const fileExtension = photoData.fileName.split('.').pop();
          const fileName = `avatar.${fileExtension}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(`${userId}/${fileName}`, 
              dataURLtoBlob(photoData.fileData), 
              { upsert: true }
            );

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(`${userId}/${fileName}`);

            const profileTable = verificationData.user_role === 'applicant' ? 'applicants' : 'employers';
            await supabase
              .from(profileTable)
              .update({ avatar_url: urlData.publicUrl })
              .eq('id', userId);
          }

          localStorage.removeItem(pendingPhotoKey);
        } catch (photoError) {
          console.error('⚠️ Photo upload error (continuing):', photoError);
        }
      }

      // 6. SUCCESS - Only set success state once everything is done
      console.log('🎉 ALL STEPS COMPLETED SUCCESSFULLY!');
      setStatus('success');
      setMessage('Email verified successfully! You can now log in.');
      
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);

    } catch (error) {
      console.error('💥 UNEXPECTED ERROR:', error);
      setStatus('error');
      setMessage('An unexpected error occurred. Please try logging in directly.');
    }
  };

  const dataURLtoBlob = (dataURL) => {
    try {
      const byteString = atob(dataURL.split(',')[1]);
      const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mimeString });
    } catch (error) {
      console.error('Blob conversion error:', error);
      return null;
    }
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
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-orange-600 transition mb-2"
            >
              Go to Login
            </button>
            <button
              onClick={() => router.push('/auth/signup')}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Try Signing Up Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}