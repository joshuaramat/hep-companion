import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/services/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Create supabase client response
  const response = NextResponse.next();
  
  // Add security headers in production only
  if (process.env.NODE_ENV === 'production') {
    // Add Content Security Policy header
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data:; " +
      "connect-src 'self' https://*.supabase.co; " +
      "frame-ancestors 'none';"
    );
    
    // Add HTTP Strict Transport Security header
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
    
    // Add other security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }
  
  // Check for auth routes that don't require authentication
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  
  // For API routes, let the API handlers check authentication
  if (isApiRoute) {
    return response;
  }
  
  // Handle authentication for client-side routes
  const supabase = createClient(request);
  
  // Exclude auth routes from authentication check
  if (!isAuthRoute) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    // If user is not authenticated and not on an auth route, redirect to login
    if (!session) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirectUrl', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    // Add routes that should check auth and add security headers
    "/((?!_next/static|_next/image|favicon.ico|.*\\.ico|.*\\.svg).*)",
  ],
}; 