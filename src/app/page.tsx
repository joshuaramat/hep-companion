'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSuggestions from '@/components/features/LoadingSuggestions';
import GenerationProgress from '@/components/features/GenerationProgress';
import { createClient } from '@/services/supabase/client';
import { useToast } from '@/contexts/toast-context';
import { useSSE } from '@/hooks/useSSE';
import dynamic from 'next/dynamic';

// Define the props interface for SuggestionsDisplay
interface SuggestionsDisplayProps {
  promptId: string;
  prompt: string;
  suggestions: any[];
  clinicalNotes?: string;
  citations?: string[];
  confidenceLevel?: string;
}

// Dynamically import SuggestionsDisplay to avoid SSR issues
const SuggestionsDisplay = dynamic<SuggestionsDisplayProps>(
  () => import('@/components/features/SuggestionsDisplay'),
  { 
    ssr: false,
    loading: () => <div className="flex justify-center items-center p-8">Loading results...</div>
  }
);

interface ProgressEvent {
  stage: 'started' | 'fetching-exercises' | 'generating' | 'validating' | 'storing' | 'complete';
  message: string;
  progress: number;
  estimatedTimeRemaining?: number;
  error?: string;
}

interface GeneratedResults {
  id: string;
  exercises: any[];
  clinical_notes?: string;
  citations?: string[];
  confidence_level?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [mrn, setMrn] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [progressEvent, setProgressEvent] = useState<ProgressEvent | undefined>();
  const [showProgress, setShowProgress] = useState(false);
  const [useStreamingMode, setUseStreamingMode] = useState(true);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const isSubmitting = useRef(false);
  const supabase = createClient();
  const { showToast } = useToast();

  // Use SSE hook
  const { connect, disconnect, isConnected } = useSSE('/api/generate-stream', {
    onProgress: (event) => {
      setProgressEvent(event);
    },
    onResult: async (data) => {
      // Keep the progress modal visible and show complete state
      setProgressEvent({
        stage: 'complete',
        message: 'Exercise generation complete!',
        progress: 100
      });
      
      // Store the results
      setGeneratedResults(data);
      
      // Add a small delay to show the complete state
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Hide progress and show results
      setShowProgress(false);
      setShowResults(true);
      setIsLoading(false);
    },
    onError: (errorMessage, errorCode) => {
      showToast(errorMessage, 'error');
      setError(errorMessage);
      setShowProgress(false);
      setIsLoading(false);
    }
  });

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (!session) {
        router.push('/auth/login?redirectUrl=/');
      }
    };
    
    checkAuth();
  }, []);

  // Load streaming preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('useStreamingMode');
    if (savedPreference !== null) {
      setUseStreamingMode(savedPreference === 'true');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading || isSubmitting.current || !isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    setShowResults(false);
    setGeneratedResults(null);

    try {
      // Include MRN and clinic ID if provided
      const requestBody: any = { prompt };
      if (mrn) requestBody.mrn = mrn;
      if (clinicId) requestBody.clinic_id = clinicId;

      if (useStreamingMode) {
        // Use streaming mode
        setShowProgress(true);
        setProgressEvent(undefined);
        await connect(requestBody);
      } else {
        // Use legacy non-streaming mode
        isSubmitting.current = true;
        
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.ok === false && data.message) {
            showToast(data.message, 'error');
            setError(data.message);
          } else if (data.error) {
            showToast(data.error, 'error');
            setError(data.error);
          } else {
            const errorMsg = 'Failed to generate suggestions';
            showToast(errorMsg, 'error');
            setError(errorMsg);
          }
          return;
        }

        if (!data.exercises || !data.id) {
          const errorMsg = 'Invalid response format';
          showToast(errorMsg, 'error');
          setError(errorMsg);
          return;
        }

        // Show results directly
        setGeneratedResults(data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      showToast(errorMsg, 'error');
      setError(errorMsg);
      setShowProgress(false);
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  };

  const handleCancel = () => {
    disconnect();
    setShowProgress(false);
    setIsLoading(false);
    setProgressEvent(undefined);
    showToast('Generation cancelled', 'info');
  };

  const handleNewGeneration = () => {
    setShowResults(false);
    setGeneratedResults(null);
    setPrompt('');
    setMrn('');
    setClinicId('');
  };

  const toggleStreamingMode = () => {
    const newValue = !useStreamingMode;
    setUseStreamingMode(newValue);
    localStorage.setItem('useStreamingMode', String(newValue));
    showToast(
      newValue 
        ? 'Streaming mode enabled - you\'ll see real-time progress' 
        : 'Classic mode enabled - simple loading animation',
      'info'
    );
  };

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Show results if we have them
  if (showResults && generatedResults) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto pt-16 px-4">
          <div className="mb-4">
            <button
              onClick={handleNewGeneration}
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
            >
              ← Generate New Exercises
            </button>
          </div>
          <SuggestionsDisplay
            promptId={generatedResults.id}
            prompt={prompt}
            suggestions={generatedResults.exercises}
            clinicalNotes={generatedResults.clinical_notes}
            citations={generatedResults.citations}
            confidenceLevel={generatedResults.confidence_level}
          />
        </div>
      </div>
    );
  }

  // Show generation form
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto pt-32 px-4">
        {/* Clinical Scenario Section */}
        <div className={`mb-8 bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-sm border border-gray-200 transition-all duration-700 ease-in-out ${
          isLoading && !useStreamingMode ? 'translate-y-[-200px] scale-90' : ''
        }`}>
          <div className="text-center">
            <h1 className={`text-4xl font-bold heading-gradient mb-4 transition-all duration-700 ease-in-out ${
              isLoading && !useStreamingMode ? 'text-2xl' : ''
            }`}>
              {isLoading && !useStreamingMode ? 'Your Clinical Scenario' : 'Exercise Suggestion Generator'}
            </h1>
            <p className={`text-gray-700 max-w-2xl mx-auto transition-all duration-700 ease-in-out ${
              isLoading && !useStreamingMode ? 'text-sm' : ''
            }`}>
              {isLoading && !useStreamingMode ? prompt : 'Enter your clinical scenario or exercise needs below, and we\'ll generate personalized exercise suggestions based on evidence-based physical therapy practices.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Form Section */}
        <div className={`bg-white rounded-xl shadow-md p-6 transition-all duration-700 ease-in-out ${
          isLoading && !useStreamingMode ? 'translate-y-[-200px] scale-90' : ''
        }`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Clinical Scenario */}
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Clinical Scenario or Exercise Needs
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                rows={6}
                placeholder="e.g., Patient presents with chronic lower back pain and limited mobility. Looking for exercises to improve core strength and flexibility..."
                disabled={isLoading}
              />
            </div>
            
            {/* Patient Identification (for SHA-256 hashing) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="mrn" className="block text-sm font-medium text-gray-700 mb-2">
                  Patient MRN (optional)
                </label>
                <input
                  id="mrn"
                  type="text"
                  value={mrn}
                  onChange={(e) => setMrn(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Medical Record Number"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">This will be securely hashed, not stored directly</p>
              </div>
              
              <div>
                <label htmlFor="clinicId" className="block text-sm font-medium text-gray-700 mb-2">
                  Clinic ID (optional)
                </label>
                <input
                  id="clinicId"
                  type="text"
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your clinic identifier"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Generation Mode Toggle */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Generation Mode</p>
                <p className="text-xs text-gray-500 mt-1">
                  {useStreamingMode ? 'Real-time progress updates' : 'Classic loading animation'}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleStreamingMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useStreamingMode ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
                disabled={isLoading}
              >
                <span className="sr-only">Toggle streaming mode</span>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useStreamingMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {!isLoading && (
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Generate Exercise Suggestions
              </button>
            )}
          </form>
        </div>

        {/* Loading Skeleton for non-streaming mode */}
        <div className={`transition-all duration-700 ease-in-out ${
          isLoading && !useStreamingMode ? 'opacity-100 -mt-48' : 'opacity-0'
        }`}>
          {isLoading && !useStreamingMode && <LoadingSuggestions />}
        </div>
      </div>

      {/* Progress Modal for streaming mode */}
      {showProgress && useStreamingMode && (
        <GenerationProgress
          progressEvent={progressEvent}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
} 