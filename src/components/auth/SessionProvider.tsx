'use client';

import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useEffect, useState } from 'react';
import { createClient } from '@/services/supabase/client';
import { useRouter } from 'next/navigation';

export default function SessionProvider({ 
  children,
  idleTimeout = 15 // default timeout in minutes
}: { 
  children: React.ReactNode;
  idleTimeout?: number;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { isIdle } = useIdleTimeout(idleTimeout);
  const supabase = createClient();
  const router = useRouter();

  // Check auth status on initial load
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no active session and not on login page, redirect to login
      if (!session && !window.location.pathname.includes('/auth/login')) {
        router.push('/auth/login');
      }
      
      setIsLoaded(true);
    };
    
    checkSession();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth]);

  // Show nothing while loading
  if (!isLoaded) {
    return null;
  }

  return children;
} 