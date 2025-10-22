import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');

  if (!token_hash || !type) {
    console.error('Missing token_hash or type in confirmation URL');
    const loginUrl = new URL('/auth/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'invalid_confirmation_link');
    return NextResponse.redirect(loginUrl);
  }

  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error) {
      console.error('Error verifying OTP:', error);
      const loginUrl = new URL('/auth/login', requestUrl.origin);
      loginUrl.searchParams.set('error', 'verification_failed');
      loginUrl.searchParams.set('message', error.message);
      return NextResponse.redirect(loginUrl);
    }

    // Success! Redirect to login with success message
    const loginUrl = new URL('/auth/login', requestUrl.origin);
    loginUrl.searchParams.set('verified', 'true');
    return NextResponse.redirect(loginUrl);

  } catch (err) {
    console.error('Unexpected error in email confirmation:', err);
    const loginUrl = new URL('/auth/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'server_error');
    return NextResponse.redirect(loginUrl);
  }
}