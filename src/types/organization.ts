/**
 * Organization Context Integration - TypeScript Definitions
 * 
 * This module provides comprehensive type definitions for the organization
 * context system, ensuring type safety and developer experience.
 */

// =============================================================================
// Core Organization Types
// =============================================================================

/**
 * Represents an organization in the system
 */
export interface Organization {
  /** Unique identifier for the organization */
  id: string;
  
  /** Display name of the organization */
  name: string;
  
  /** Clinic identifier for this organization */
  clinic_id: string;
  
  /** Optional physical address */
  address?: string;
  
  /** Optional contact phone number */
  phone?: string;
  
  /** Optional contact email */
  email?: string;
  
  /** Optional organization website */
  website?: string;
  
  /** Optional organization type/category */
  type?: 'clinic' | 'hospital' | 'practice' | 'therapy_center' | 'other';
  
  /** Creation timestamp */
  created_at?: string;
  
  /** Last update timestamp */
  updated_at?: string;
}

/**
 * Minimal organization data for selection and display
 */
export interface OrganizationSummary {
  id: string;
  name: string;
  clinic_id: string;
}

// =============================================================================
// Organization Context Types
// =============================================================================

/**
 * Organization context state and actions
 */
export interface OrganizationContextType {
  /** Currently selected organization */
  selectedOrganization: Organization | null;
  
  /** Select an organization and persist the selection */
  selectOrganization: (_org: Organization) => void;
  
  /** Clear the current organization selection */
  clearOrganization: () => void;
  
  /** Check if an organization is currently selected */
  isOrganizationSelected: () => boolean;
  
  /** Get the clinic ID from the selected organization */
  getSelectedClinicId: () => string | null;
  
  /** Loading state for organization operations */
  isLoading?: boolean;
  
  /** Error state for organization operations */
  error?: string | null;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Response from organization search API
 */
export interface OrganizationSearchResponse {
  organizations: Organization[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Organization search parameters
 */
export interface OrganizationSearchParams {
  /** Search query string */
  query: string;
  
  /** Page number for pagination */
  page?: number;
  
  /** Number of results per page */
  limit?: number;
  
  /** Organization type filter */
  type?: Organization['type'];
}

// =============================================================================
// Form Integration Types
// =============================================================================

/**
 * Exercise generation form with organization context
 */
export interface ExerciseGenerationFormData {
  /** Clinical scenario description */
  prompt: string;
  
  /** Patient identifier */
  patientId?: string;
  
  /** Clinic ID (auto-populated from organization) */
  clinicId?: string;
  
  /** Additional context */
  additionalContext?: string;
}

/**
 * User profile with organization information
 */
export interface UserProfile {
  /** User identifier */
  id: string;
  
  /** User email */
  email: string;
  
  /** User's default organization */
  organization?: Organization;
  
  /** User's default clinic ID */
  clinic_id?: string;
  
  /** User preferences */
  preferences?: {
    defaultOrganization?: string;
    rememberOrganization?: boolean;
  };
}

// =============================================================================
// Storage Types
// =============================================================================

/**
 * Organization data stored in localStorage
 */
export interface StoredOrganizationData {
  organization: Organization;
  timestamp: number;
  version: string;
}

/**
 * Storage key constants
 */
export const STORAGE_KEYS = {
  SELECTED_ORGANIZATION: 'selectedOrganization',
  USER_PREFERENCES: 'userPreferences',
  ORGANIZATION_CACHE: 'organizationCache'
} as const;

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Organization state for UI components
 */
export type OrganizationState = 
  | { status: 'idle'; organization: null }
  | { status: 'loading'; organization: null }
  | { status: 'selected'; organization: Organization }
  | { status: 'error'; organization: null; error: string };

/**
 * Organization selection status
 */
export type OrganizationSelectionStatus = 'none' | 'selected' | 'loading' | 'error';

/**
 * Organization context provider props
 */
export interface OrganizationProviderProps {
  children: React.ReactNode;
  initialOrganization?: Organization | null;
}

// =============================================================================
// Event Types
// =============================================================================

/**
 * Organization context events
 */
export interface OrganizationEvents {
  'organization:selected': { organization: Organization };
  'organization:cleared': {};
  'organization:error': { error: string };
  'organization:restored': { organization: Organization };
}

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * Organization selector component props
 */
export interface OrganizationSelectorProps {
  /** Callback when organization is selected */
  onSelect?: (_organization: Organization) => void;
  
  /** Show clear button */
  showClear?: boolean;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Custom CSS classes */
  className?: string;
}

/**
 * Organization display component props
 */
export interface OrganizationDisplayProps {
  /** Organization to display */
  organization: Organization | null;
  
  /** Show clinic ID */
  showClinicId?: boolean;
  
  /** Show contact information */
  showContact?: boolean;
  
  /** Compact display mode */
  compact?: boolean;
  
  /** Custom CSS classes */
  className?: string;
}

// =============================================================================
// Hook Return Types
// =============================================================================

/**
 * Return type for useOrganizationContext hook
 */
export interface UseOrganizationContextReturn extends OrganizationContextType {
  /** Helper to check if organization has clinic ID */
  hasClinicId: boolean;
  
  /** Helper to get organization display name */
  displayName: string | null;
  
  /** Helper to format organization for display */
  formatForDisplay: () => string;
}

/**
 * Return type for useUserProfile hook
 */
export interface UseUserProfileReturn {
  /** User profile data */
  profile: UserProfile | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Reload user profile */
  reload: () => Promise<void>;
  
  /** Update user preferences */
  updatePreferences: (_preferences: Partial<UserProfile['preferences']>) => Promise<void>;
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Organization validation schema
 */
export interface OrganizationValidation {
  /** Required fields validation */
  required: {
    id: boolean;
    name: boolean;
    clinic_id: boolean;
  };
  
  /** Field format validation */
  format: {
    email?: RegExp;
    phone?: RegExp;
    website?: RegExp;
  };
  
  /** Field length constraints */
  length: {
    name: { min: number; max: number };
    clinic_id: { min: number; max: number };
  };
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Organization-specific error types
 */
export class OrganizationError extends Error {
  constructor(
    message: string,
    public _code: 'NOT_FOUND' | 'INVALID_DATA' | 'STORAGE_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR',
    public _context?: Record<string, any>
  ) {
    super(message);
    this.name = 'OrganizationError';
  }
}

/**
 * Organization error details
 */
export interface OrganizationErrorDetails {
  code: string;
  message: string;
  field?: string;
  value?: any;
  timestamp: number;
} 