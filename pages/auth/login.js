import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useRouter } from 'next/router';
import { Eye, EyeOff, MailCheck, AlertCircle, Upload } from 'lucide-react';
import Image from 'next/image';

// Helper function to convert base64 back to file
const base64ToFile = (base64, fileName, fileType) => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new File([ab], fileName, { type: fileType });
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [hasPendingPhoto, setHasPendingPhoto] = useState(false);
  const router = useRouter();

  // Check for verification success or errors in URL query parameters
  useEffect(() => {
    if (router.query.verified === 'true') {
      setSuccessMsg('Email verified successfully! You can now log in to your account.');
      // Clear the query parameter from URL
      const newQuery = { ...router.query };
      delete newQuery.verified;
      router.replace({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
    }

    if (router.query.error) {
      let errorMessage = 'An error occurred during authentication.';
      
      switch (router.query.error) {
        case 'verification_failed':
          errorMessage = 'Email verification failed. Please try again or request a new verification email.';
          break;
        case 'invalid_confirmation_link':
          errorMessage = 'Invalid confirmation link. Please request a new verification email.';
          break;
        case 'session_error':
          errorMessage = 'Session error. Please try logging in again.';
          break;
        case 'auth_failed':
          errorMessage = router.query.message || 'Authentication failed. Please try again.';
          break;
        default:
          errorMessage = router.query.message || 'An error occurred. Please try again.';
      }
      
      setErrorMsg(errorMessage);
      // Clear the query parameter from URL
      const newQuery = { ...router.query };
      delete newQuery.error;
      delete newQuery.message;
      router.replace({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
    }
  }, [router.query, router]);

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Function to handle pending photo upload
  const handlePendingPhotoUpload = async (user) => {
  const pendingPhotoKey = `pending_photo_${user.id}`;
  const pendingPhotoData = localStorage.getItem(pendingPhotoKey);
  
  if (pendingPhotoData && user.email_confirmed_at) {
    try {
      setUploadingPhoto(true);
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
          
          const { error: updateError } = await supabase.from(profileTable)
            .update({ avatar_url: publicUrlData.publicUrl })
            .eq('id', user.id);

          if (!updateError) {
            // ✅ ADDED: Force refresh of user data
            await supabase.auth.refreshSession();
            
            // Clean up
            localStorage.removeItem(pendingPhotoKey);
            setHasPendingPhoto(false);
            setSuccessMsg('Profile photo uploaded successfully!');
            
            // ✅ ADDED: Optional - small delay then refresh page
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error('Pending photo upload failed:', error);
    } finally {
      setUploadingPhoto(false);
    }
  }
};

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Handle specific error cases
        if (authError.message.includes('Invalid login credentials')) {
          setErrorMsg('Invalid email or password. Please try again.');
        } else if (authError.message.includes('Email not confirmed')) {
          setErrorMsg('Please verify your email address before logging in. Check your inbox for the verification link.');
        } else {
          setErrorMsg(authError.message);
        }
        setLoading(false);
        return;
      }

      const user = authData.user;

      if (!user) {
        setErrorMsg('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      // Check if email is verified
      if (!user.email_confirmed_at) {
        setErrorMsg('Please verify your email address before logging in. Check your inbox for the verification link.');
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

      // Check for pending photo upload
      const pendingPhotoKey = `pending_photo_${user.id}`;
      const pendingPhotoData = localStorage.getItem(pendingPhotoKey);
      if (pendingPhotoData) {
        setHasPendingPhoto(true);
        // Start photo upload in background (don't wait for it)
        handlePendingPhotoUpload(user);
      }

      const role = userProfile.role;

      // Redirect based on role
      if (role === 'applicant') {
        router.push('/dashboard/applicant');
      } else if (role === 'employer') {
        router.push('/dashboard/employer');
      } else {
        setErrorMsg('Invalid user role. Please contact support.');
        setLoading(false);
      }

    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setErrorMsg('Please enter your email address to resend verification.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setErrorMsg('Failed to resend verification email. Please try again.');
      } else {
        setSuccessMsg('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      setErrorMsg('Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-white px-4 pt-20 pb-10">
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="https://xatxjdsppcjgplmrtjcs.supabase.co/storage/v1/object/public/avatars/icon.png"
          alt="Gigzz Logo"
          width={100}
          height={30}
          priority
        />
      </div>

      <div className="w-full max-w-md bg-white border rounded-xl shadow p-6 space-y-5">
        <h1 className="text-2xl font-bold text-black text-center">Login</h1>

        {/* Photo Upload Status */}
        {uploadingPhoto && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-blue-800 font-medium">Uploading Profile Photo...</p>
                <p className="text-blue-700 text-sm mt-1">Please wait while we upload your profile photo.</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MailCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-medium">Success!</p>
                <p className="text-green-700 text-sm mt-1">{successMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm mt-1">{errorMsg}</p>
                
                {/* Show resend verification button for email confirmation errors */}
                {(errorMsg.includes('verify your email') || errorMsg.includes('Email not confirmed')) && (
                  <button
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="text-red-700 underline text-sm mt-2 hover:text-red-800 disabled:opacity-50"
                  >
                    Resend verification email
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            <span
              className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 hover:text-orange-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || uploadingPhoto}
            className={`w-full p-3 rounded-lg text-white font-medium transition ${
              loading || uploadingPhoto
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-black hover:bg-orange-600'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging in...
              </span>
            ) : uploadingPhoto ? (
              <span className="flex items-center justify-center gap-2">
                <Upload className="w-4 h-4 animate-pulse" />
                Uploading Photo...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Pending Photo Notice */}
        {hasPendingPhoto && !uploadingPhoto && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Upload className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-orange-800 font-medium">Profile Photo Pending</p>
                <p className="text-orange-700 text-sm mt-1">
                  Your profile photo will be uploaded automatically. You can also update it later in your profile settings.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center space-y-3 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Forgot password?{' '}
            <a href="/auth/reset" className="text-orange-600 hover:text-black font-semibold">
              Reset here
            </a>
          </p>
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/auth/signup" className="text-orange-600 hover:text-black font-semibold">
              Sign up
            </a>
          </p>
        </div>

        {/* Additional Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-blue-800 text-sm text-center">
            💡 <strong>Need help?</strong> Contact{' '}
            <a href="mailto:support@gigzz.com" className="underline hover:text-blue-900">
              support@gigzz.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}