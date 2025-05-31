import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/services/supabase/client';

interface UserProfile {
  id: string;
  full_name?: string;
  clinic_id?: string;
  organization?: string;
  profession?: string;
  updated_at?: string;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setProfile(null);
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Failed to load user profile:', profileError);
        setError('Failed to load profile data');
        return;
      }

      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Error loading profile');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile
  };
} 