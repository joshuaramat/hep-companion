import { Database } from '@/services/supabase/types';

// Exercise condition types
export type ExerciseCondition = 'LBP' | 'ACL' | 'PFP';

// Exercise table types from Supabase
export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type ExerciseInsert = Database['public']['Tables']['exercises']['Insert'];
export type ExerciseUpdate = Database['public']['Tables']['exercises']['Update'];

// Exercise condition enum for easier use
export const ExerciseConditions = {
  LBP: 'LBP' as const,
  ACL: 'ACL' as const, 
  PFP: 'PFP' as const,
} as const;

// Exercise condition labels for UI
export const ExerciseConditionLabels: Record<ExerciseCondition, string> = {
  LBP: 'Low Back Pain',
  ACL: 'ACL Rehabilitation',
  PFP: 'Patellofemoral Pain',
};

// Exercise filter and search types
export interface ExerciseFilters {
  condition?: ExerciseCondition;
  year?: number;
  journal?: string;
  searchTerm?: string;
}

// Exercise with citation count (for enhanced display)
export interface ExerciseWithMeta extends Exercise {
  citationCount?: number;
  isRecentlyAdded?: boolean;
}

// Exercise validation schema type
export interface ExerciseValidation {
  isValid: boolean;
  errors: string[];
}

// Exercise API response types
export interface ExerciseApiResponse {
  exercises: Exercise[];
  total: number;
  page: number;
  limit: number;
} 