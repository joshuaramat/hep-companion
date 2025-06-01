import React from 'react';
import { ApiErrorCode, errorMessages } from '@/types/api';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface ErrorMessageProps {
  error: {
    message: string;
    code?: string;
    details?: string;
  };
  onRetry?: () => void;
}

/**
 * Component for displaying user-friendly error messages
 * Tailored for Clinical/PT users with appropriate terminology
 */
export default function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  // Get user-friendly message based on error code, or use the provided message
  const userMessage = error.code && errorMessages[error.code] 
    ? errorMessages[error.code] 
    : error.message;
  
  // Determine if we should show technical details (for certain error types)
  const showDetails = error.details && 
    (error.code === ApiErrorCode._INPUT_VALIDATION_ERROR || 
     error.code === ApiErrorCode._VALIDATION_ERROR);
  
  return (
    <div className="rounded-md bg-amber-50 p-4 border border-amber-200 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon 
            className="h-5 w-5 text-amber-600" 
            aria-hidden="true" 
          />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">
            Suggestion generation issue
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>{userMessage}</p>
            
            {showDetails && (
              <p className="mt-2 text-xs text-amber-600">
                <strong>Suggestion:</strong> {error.details}
              </p>
            )}
          </div>
          
          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 