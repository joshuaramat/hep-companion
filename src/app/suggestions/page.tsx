'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExerciseSuggestion } from '@/types';
import ExerciseSuggestionsDisplay from '@/components/ExerciseSuggestionsDisplay';

export default function SuggestionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const prompt = searchParams.get('prompt');
  const suggestionsParam = searchParams.get('suggestions');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, { score: number; comment?: string }>>({});

  if (!id || !prompt || !suggestionsParam) {
    router.push('/');
    return null;
  }

  const suggestions: ExerciseSuggestion[] = JSON.parse(decodeURIComponent(suggestionsParam));

  const handleFeedbackChange = (suggestionId: string, score: number, comment?: string) => {
    setFeedback(prev => ({
      ...prev,
      [suggestionId]: { score, comment }
    }));
  };

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true);

    try {
      // Here you would typically send the feedback to your backend
      // For now, we'll just navigate to the success page
      router.push('/success');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8 bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Your Clinical Scenario</h2>
          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{decodeURIComponent(prompt)}</p>
        </div>

        <ExerciseSuggestionsDisplay 
          suggestions={suggestions}
          onFeedbackChange={handleFeedbackChange}
        />

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmitFeedback}
            disabled={isSubmitting}
            className="bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
} 