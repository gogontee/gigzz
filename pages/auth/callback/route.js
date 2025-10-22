// app/auth/callback/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // If there's an error, redirect to login with error message
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=auth_failed&message=${encodeURIComponent(errorDescription || error)}`
    )
  }

  // If code is present, exchange it for a session
  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { error: authError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (authError) {
        console.error('Code exchange error:', authError)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/login?error=session_error&message=${encodeURIComponent(authError.message)}`
        )
      }

      // Success - get user data and redirect to appropriate dashboard
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get user role from your users table
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = userProfile?.role || 'applicant'
        
        if (role === 'applicant') {
          return NextResponse.redirect(`${requestUrl.origin}/dashboard/applicant`)
        } else if (role === 'employer') {
          return NextResponse.redirect(`${requestUrl.origin}/dashboard/employer`)
        }
      }

      // Fallback redirect
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)

    } catch (error) {
      console.error('Callback processing error:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=session_error&message=Authentication failed`
      )
    }
  }

  // If no code and no error, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
}