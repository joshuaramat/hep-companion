import { useState, useCallback } from 'react';
import { ApiErrorCode, ApiErrorResponse, errorMessages } from '@/types/api';

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
  field?: string;
}

/**
 * Custom hook for handling API errors consistently across the application
 * Makes error handling user-friendly for clinical users
 */
export function useErrorHandler() {
  const [error, setError] = useState<ApiError | null>(null);

  /**
   * Process API error response and set standardized error state
   */
  const handleApiError = useCallback((error: any) => {
    // If the error is already in our expected format
    if (error?.message && typeof error.message === 'string') {
      setError({
        message: error.message,
        code: error.code,
        details: error.details,
        field: error.field
      });
      return;
    }
    
    // Handle fetch response errors
    if (error?.json && typeof error.json === 'function') {
      error.json()
        .then((data: ApiErrorResponse) => {
          setError({
            message: data.error || 'An error occurred',
            code: data.code,
            details: typeof data.details === 'string' ? data.details : JSON.stringify(data.details),
            field: data.field
          });
        })
        .catch(() => {
          // If we can't parse the error response JSON
          setError({
            message: error.statusText || 'An error occurred',
            code: ApiErrorCode._UNEXPECTED_ERROR
          });
        });
      return;
    }
    
    // Handle network errors and other unexpected errors
    setError({
      message: error?.toString() || 'An unexpected error occurred',
      code: ApiErrorCode._UNEXPECTED_ERROR
    });
  }, []);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get user-friendly message for a given error code
   */
  const getUserFriendlyMessage = useCallback((code: string) => {
    return errorMessages[code] || 'An error occurred';
  }, []);

  return { 
    error,
    setError,
    handleApiError,
    clearError,
    getUserFriendlyMessage
  };
} 