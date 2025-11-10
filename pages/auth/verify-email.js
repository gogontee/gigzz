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
      setMessage('Invalid verification link');
      return;
    }

    verifyEmailToken(token);
  }, [token]);

  const verifyEmailToken = async (verificationToken) => {
    try {
      console.log('🔍 Verifying token:', verificationToken);

      // 1. Get verification data from database - CORRECTED COLUMN NAMES
      const { data: verificationData, error: fetchError } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('token', verificationToken)
        .single();

      if (fetchError || !verificationData) {
        console.error('❌ Token fetch error:', fetchError);
        setStatus('error');
        setMessage('Invalid or expired verification link');
        return;
      }

      console.log('✅ Found verification data:', verificationData);

      const userId = verificationData.user_id; // CORRECTED: user_id instead of userId

      // 2. Check if token is expired (24 hours) - CORRECTED COLUMN NAME
      if (new Date() > new Date(verificationData.expires_at)) { // CORRECTED: expires_at instead of expiresAt
        setStatus('error');
        setMessage('Verification link has expired. Please sign up again.');
        return;
      }

      // 3. Update user email verification status in users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ email_verified: true })
        .eq('id', userId); // CORRECTED: userId instead of verificationData.userId

      if (updateError) {
        console.error('❌ User update error:', updateError);
        setStatus('error');
        setMessage('Failed to verify email');
        return;
      }

      // 4. Update auth user metadata
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        userId, // CORRECTED: userId instead of verificationData.userId
        { 
          user_metadata: { 
            email_verified: true
          } 
        }
      );

      if (authUpdateError) {
        console.error('⚠️ Auth update error (continuing):', authUpdateError);
        // Continue anyway - the main verification is done
      }

      // 5. Handle pending photo upload if exists
      const pendingPhotoKey = `pending_photo_${userId}`; // CORRECTED: userId instead of verificationData.userId
      const pendingPhoto = localStorage.getItem(pendingPhotoKey);
      
      if (pendingPhoto) {
        try {
          const photoData = JSON.parse(pendingPhoto);
          // Upload photo to Supabase Storage
          const fileExtension = photoData.fileName.split('.').pop();
          const fileName = `avatar.${fileExtension}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(`${userId}/${fileName}`, // CORRECTED: userId instead of verificationData.userId
              dataURLtoBlob(photoData.fileData), 
              { upsert: true }
            );

          if (!uploadError) {
            // Get public URL and update profile
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(`${userId}/${fileName}`); // CORRECTED: userId instead of verificationData.userId

            const profileTable = verificationData.user_role === 'applicant' ? 'applicants' : 'employers'; // CORRECTED: user_role instead of userRole
            await supabase
              .from(profileTable)
              .update({ avatar_url: urlData.publicUrl })
              .eq('id', userId); // CORRECTED: userId instead of verificationData.userId
          }

          // Clean up localStorage
          localStorage.removeItem(pendingPhotoKey);
        } catch (photoError) {
          console.error('⚠️ Photo upload error (continuing):', photoError);
          // Don't fail verification because of photo upload
        }
      }

      // 6. Clean up verification record
      await supabase
        .from('email_verifications')
        .delete()
        .eq('token', verificationToken);

      console.log('✅ Email verification completed successfully!');
      setStatus('success');
      setMessage('Email verified successfully! You can now log in.');
      
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);

    } catch (error) {
      console.error('💥 Verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification');
    }
  };

  const dataURLtoBlob = (dataURL) => {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {status === 'verifying' && (
          <>
            <Loader className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
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
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-orange-600 transition"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}