import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the URL hash fragments (Supabase auth data)
      const { hash } = window.location;
      
      if (hash) {
        try {
          // Process the authentication data
          const { data, error } = await supabase.auth.getSessionFromUrl({ url: window.location.href });
          
          if (error) {
            console.error('Auth callback error:', error);
            router.push('/auth/login?error=auth_failed');
            return;
          }

          if (data?.session) {
            // Get user role and redirect accordingly
            const { data: userProfile } = await supabase
              .from('users')
              .select('role')
              .eq('id', data.session.user.id)
              .single();

            const role = userProfile?.role || 'applicant';
            
            // Handle pending photo upload if exists
            const pendingPhotoKey = `pending_photo_${data.session.user.id}`;
            const pendingPhotoData = localStorage.getItem(pendingPhotoKey);
            
            if (pendingPhotoData) {
              // Upload the pending photo (use the function from login page)
              await handlePendingPhotoUpload(data.session.user);
            }

            if (role === 'applicant') {
              router.push('/dashboard/applicant');
            } else if (role === 'employer') {
              router.push('/dashboard/employer');
            }
          }
        } catch (error) {
          console.error('Callback processing error:', error);
          router.push('/auth/login?error=session_error');
        }
      } else {
        // No hash found, redirect to login
        router.push('/auth/login');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Completing Authentication...
        </h1>
        <p className="text-gray-600">
          Please wait while we log you in.
        </p>
      </div>
    </div>
  );
}

// Add the photo upload function here as well
const base64ToFile = (base64, fileName, fileType) => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new File([ab], fileName, { type: fileType });
};

const handlePendingPhotoUpload = async (user) => {
  const pendingPhotoKey = `pending_photo_${user.id}`;
  const pendingPhotoData = localStorage.getItem(pendingPhotoKey);
  
  if (pendingPhotoData && user.email_confirmed_at) {
    try {
      const { fileData, fileName, fileType, folder } = JSON.parse(pendingPhotoData);
      
      // Convert base64 back to file
      const file = base64ToFile(fileData, fileName, fileType);
      
      const filePath = `${folder}/${user.id}-${Date.now()}-${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profilephoto')
        .upload(filePath, file);

      if (!uploadError) {
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('profilephoto')
          .getPublicUrl(filePath);

        // Update user profile with photo URL
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userProfile) {
          const profileTable = userProfile.role === 'applicant' ? 'applicants' : 'employers';
          
          await supabase.from(profileTable)
            .update({ avatar_url: publicUrlData.publicUrl })
            .eq('id', user.id);

          // Clean up
          localStorage.removeItem(pendingPhotoKey);
        }
      }
    } catch (error) {
      console.error('Pending photo upload failed:', error);
    }
  }
};