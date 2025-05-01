import { createClient } from '@/services/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // Get the redirectUrl from searchParams or default to '/'
  const redirectUrl = searchParams.get('redirectUrl') || '/';
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
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