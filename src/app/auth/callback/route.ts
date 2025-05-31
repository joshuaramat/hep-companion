import { createClient } from '@/services/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // Get the redirectUrl from searchParams or default to '/'
  const redirectUrl = searchParams.get('redirectUrl') || '/';
  
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if this is a new user or if they need to complete onboarding
      if (data.session) {
        // Get the user profile to check if onboarding is complete
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', data.session.user.id)
          .single();
          
        // If the profile doesn't exist or onboarding is not completed, redirect to onboarding
        if (!profile || profile.onboarding_completed !== true) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }
      
      // Redirect to the originally requested URL or home page
      return NextResponse.redirect(`${origin}${redirectUrl}`);
    }
    
    // If there was an error, log it and redirect to login with error
    console.error('Error exchanging code for session:', error);
    return NextResponse.redirect(`${origin}/auth/login?error=session_exchange_failed`);
  }
  
  // If no code was provided, redirect to login
  return NextResponse.redirect(`${origin}/auth/login?error=no_code_provided`);
} 