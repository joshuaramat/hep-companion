'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSuggestions from '@/components/features/LoadingSuggestions';

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmitting = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isSubmitting.current) return;

    isSubmitting.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate suggestions');
      }

      if (!data.suggestions) {
        throw new Error('Invalid response format');
      }

      // Use the shorter ID in the URL
      router.push(`/suggestions?id=${data.id}&prompt=${encodeURIComponent(prompt)}&suggestions=${encodeURIComponent(JSON.stringify(data.suggestions))}`);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto pt-32 px-4">
        {/* Clinical Scenario Section - Will animate to new position */}
        <div 
          className={`mb-8 bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-sm border border-gray-200 transition-all duration-700 ease-in-out ${
            isLoading ? 'translate-y-[-200px] scale-90' : ''
          }`}
        >
          <div className="text-center">
            <h1 className={`text-4xl font-bold heading-gradient mb-4 transition-all duration-700 ease-in-out ${
              isLoading ? 'text-2xl' : ''
            }`}>
              {isLoading ? 'Your Clinical Scenario' : 'Exercise Suggestion Generator'}
            </h1>
            <p className={`text-gray-700 max-w-2xl mx-auto transition-all duration-700 ease-in-out ${
              isLoading ? 'text-sm' : ''
            }`}>
              {isLoading ? prompt : 'Enter your clinical scenario or exercise needs below, and we\'ll generate personalized exercise suggestions based on evidence-based physical therapy practices.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Form Section - Will animate to new position */}
        <div 
          className={`bg-white rounded-xl shadow-md p-6 transition-all duration-700 ease-in-out ${
            isLoading ? 'translate-y-[-200px] scale-90' : ''
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Loading Skeleton - Will fade in as form animates up */}
        <div 
          className={`transition-all duration-700 ease-in-out ${
            isLoading ? 'opacity-100 -mt-48' : 'opacity-0'
          }`}
        >
          {isLoading && <LoadingSuggestions />}
        </div>
      </div>
    </div>
  );
} 