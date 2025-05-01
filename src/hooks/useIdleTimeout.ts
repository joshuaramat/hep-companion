import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/services/supabase/client';

/**
 * A React hook to handle user idle timeout
 * @param idleTime The idle time in minutes before user is logged out (default: 15 minutes)
 */
export function useIdleTimeout(idleTime = 15) {
  const [isIdle, setIsIdle] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const idleTimeoutMs = idleTime * 60 * 1000; // Convert minutes to milliseconds
    let idleTimer: NodeJS.Timeout;

    // Function to reset the idle timer
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      setIsIdle(false);
      idleTimer = setTimeout(handleUserIdle, idleTimeoutMs);
    };

    // Function to handle idle user
    const handleUserIdle = async () => {
      setIsIdle(true);
      
      // Log the user out
      await supabase.auth.signOut();
      
      // Redirect to the login page with a message
      router.push('/auth/login?message=Your session has expired due to inactivity');
    };

    // Events that reset the idle timer
    const events = [
      'mousemove',
      'mousedown',
      'keypress',
      'touchmove',
      'touchstart',
      'scroll',
    ];

    // Start the idle timer
    resetIdleTimer();

    // Add event listeners to reset the idle timer
    events.forEach(event => {
      window.addEventListener(event, resetIdleTimer);
    });

    // Cleanup
    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [idleTime, router, supabase.auth]);

  return { isIdle };
} 