import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/services/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Create a response object
  const response = NextResponse.next();
  
  // Add security headers (now applied in all environments for testing)
  // Content Security Policy - strict for healthcare/HIPAA compliance
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "connect-src 'self' https://*.supabase.co; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'none'; " +
    "upgrade-insecure-requests;"
  );
  
  // HTTP Strict Transport Security header with exact requirements
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // Additional security headers for healthcare applications
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Check for auth routes that don't require authentication
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isPublicAsset = request.nextUrl.pathname.match(/\.(ico|svg|png|jpg|jpeg|css|js)$/);
  
  // Skip authentication for public assets and API routes
  if (isApiRoute || isPublicAsset) {
    return response;
  }
  
  // Skip authentication check for auth routes
  if (isAuthRoute) {
    return response;
  }
  
  // Handle authentication for client-side routes
  try {
    const supabase = createClient(request);
    const { data: { session } } = await supabase.auth.getSession();
    
    // If user is not authenticated, redirect to login
    if (!session) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirectUrl', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    return response;
  } catch (error) {
    console.error('Middleware authentication error:', error);
    // If there's an error checking authentication, redirect to login as a fallback
    const redirectUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: [
    // Add routes that should check auth and add security headers
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}; 