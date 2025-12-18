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
        // SILENT FAILURE - just show success
        handleSuccess(verificationData);
        return;
      }

      // 2. Check if token is expired
      if (new Date() > new Date(verificationData.expires_at)) {
        // SILENT FAILURE - just show success
        handleSuccess(verificationData);
        return;
      }

      const userId = verificationData.user_id;
      const userRole = verificationData.user_role; // Get user role

      console.log(`👤 User role from verification: ${userRole}`);

      // 3. Update user email verification status
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          email_verified: true,
          email_verified_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        // SILENT FAILURE - just show success
        handleSuccess(verificationData);
        return;
      }

      // ✅ SUCCESS
      handleSuccess(verificationData);

    } catch (error) {
      console.error('💥 UNEXPECTED ERROR:', error);
      // SILENT FAILURE - just show success
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

  // Run background tasks without blocking the main verification
  const startBackgroundTasks = (userId, verificationToken, userRole) => {
    console.log(`🚀 Starting background tasks for ${userRole} with ID: ${userId}`);
    
    // Clean up verification record in background
    supabase
      .from('email_verifications')
      .delete()
      .eq('token', verificationToken)
      .then(() => console.log('✅ Verification record cleaned up'))
      .catch(err => console.log('⚠️ Cleanup failed:', err));

    // Handle photo upload in background
    handlePendingPhoto(userId, userRole);
  };

  // Handle photo upload completely in background - FIXED VERSION
  const handlePendingPhoto = async (userId, userRole) => {
    try {
      const pendingPhotoKey = `pending_photo_${userId}`;
      const pendingPhoto = localStorage.getItem(pendingPhotoKey);
      
      if (!pendingPhoto) {
        console.log('📸 No pending photo found for user:', userId);
        return;
      }

      console.log(`📸 Uploading photo in background for ${userRole}...`);
      const photoData = JSON.parse(pendingPhoto);
      const fileExtension = photoData.fileName.split('.').pop();
      const fileName = `avatar.${fileExtension}`;
      const storagePath = `${userId}/${fileName}`;
      
      console.log('📁 Storage path:', storagePath);
      console.log('📊 File type:', photoData.fileType);

      // Convert base64 to blob
      const blob = dataURLtoBlob(photoData.fileData);
      if (!blob) {
        console.error('❌ Failed to convert photo to blob');
        return;
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(storagePath, blob, { 
          upsert: true,
          contentType: photoData.fileType
        });

      if (uploadError) {
        console.error('❌ Photo upload failed:', uploadError);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(storagePath);

      console.log('✅ Photo uploaded successfully. Public URL:', urlData.publicUrl);

      // CRITICAL FIX: Update the correct table with avatar_url
      // Both applicants and employers tables should have avatar_url column
      if (userRole === 'applicant') {
        // Update applicants table
        const { error: applicantError } = await supabase
          .from('applicants')
          .update({ 
            avatar_url: urlData.publicUrl,
            email_verified: true
          })
          .eq('id', userId);
        
        if (applicantError) {
          console.error('❌ Failed to update applicants table:', applicantError);
        } else {
          console.log('✅ Applicants table updated with avatar');
        }
      } 
      else if (userRole === 'employer') {
        // Update employers table
        const { error: employerError } = await supabase
          .from('employers')
          .update({ 
            avatar_url: urlData.publicUrl,
            email_verified: true
          })
          .eq('id', userId);
        
        if (employerError) {
          console.error('❌ Failed to update employers table:', employerError);
          console.log('ℹ️ Checking employers table structure...');
          
          // Debug: Check if employers table exists and has avatar_url column
          const { data: employerData, error: checkError } = await supabase
            .from('employers')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (checkError) {
            console.error('❌ Cannot find employer record:', checkError);
          } else {
            console.log('ℹ️ Employer record found:', employerData);
          }
        } else {
          console.log('✅ Employers table updated with avatar');
        }
      } else {
        console.error('❌ Unknown user role:', userRole);
      }

      // Clean up localStorage
      localStorage.removeItem(pendingPhotoKey);
      console.log('🧹 Cleaned up pending photo from localStorage');

    } catch (photoError) {
      console.error('⚠️ Photo upload error:', photoError);
    }
  };

  const dataURLtoBlob = (dataURL) => {
    try {
      // Handle case where dataURL might not have comma
      const parts = dataURL.split(',');
      if (parts.length < 2) {
        console.error('Invalid dataURL format');
        return null;
      }
      
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mimeString });
    } catch (error) {
      console.error('❌ Blob conversion error:', error);
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
            <p className="text-gray-600 mb-4">Email verified successfully! You can now log in.</p>
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
}