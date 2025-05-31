import React, { useState } from 'react';
import { validateClinicalInput } from '@/services/utils/validation';
import ErrorMessage from '../ui/ErrorMessage';
import { useErrorHandler, ApiError } from '@/hooks/useErrorHandler';

interface GenerateFormProps {
  onSubmit: (_prompt: string) => void;
  isLoading: boolean;
}

export default function GenerateForm({ onSubmit, isLoading }: GenerateFormProps) {
  const [prompt, setPrompt] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { error, handleApiError, clearError } = useErrorHandler();
  
  // Handle form submission with input validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Trim whitespace
    const trimmedPrompt = prompt.trim();
    
    // Perform client-side validation
    const validation = validateClinicalInput(trimmedPrompt);
    
    if (!validation.isValid) {
      setValidationError(validation.error || 'Please provide valid clinical information');
      return;
    }
    
    setValidationError(null);
    
    try {
      await onSubmit(trimmedPrompt);
    } catch (err) {
      handleApiError(err);
    }
  };
  
  // Clear validation error when user starts typing again
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
            Clinical Scenario
          </label>
          <div className="mt-1">
            <textarea
              id="prompt"
              name="prompt"
              rows={4}
              className={`shadow-sm block w-full sm:text-sm rounded-md p-2 ${
                validationError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Describe the patient's condition and needs (e.g., Patient has subacute nonspecific low back pain, pain with flexion, no radicular symptoms. Needs core endurance and hip mobility work.)"
              value={prompt}
              onChange={handlePromptChange}
              disabled={isLoading}
              aria-invalid={validationError ? 'true' : 'false'}
              aria-describedby={validationError ? 'prompt-error' : undefined}
            />
          </div>
          
          {validationError && (
            <p className="mt-2 text-sm text-red-600" id="prompt-error">
              {validationError}
              {validationError.includes('clinical terms') && (
                <span className="block mt-1">
                  Include specific details like body region, diagnosis, or treatment goals.
                </span>
              )}
            </p>
          )}
          
          <p className="mt-2 text-xs text-gray-500">
            For best results, include diagnosis, symptom location, relevant medical history, and treatment goals.
          </p>
        </div>
        
        {error && (
          <ErrorMessage 
            error={error as ApiError}
            onRetry={() => clearError()}
          />
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isLoading || !prompt.trim()
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Exercises'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 