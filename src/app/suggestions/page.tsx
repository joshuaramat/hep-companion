'use client';

import { useState, useRef } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { score: number; comment?: string }>>({});
  const isSubmittingRef = useRef(false);

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
    if (isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate that we have scores for all suggestions
      const suggestionIds = suggestions.map(s => s.id);
      const feedbackIds = Object.keys(feedback);
      
      const missingFeedback = suggestionIds.filter(id => {
        const fb = feedback[id];
        return !fb || typeof fb.score !== 'number';
      });

      if (missingFeedback.length > 0) {
        throw new Error('Please rate all exercises before submitting');
      }

      // Here you would typically send the feedback to your backend
      router.push('/success');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto pt-32 pb-8 px-4">
        <div className="mb-8 bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Your Clinical Scenario</h2>
          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{decodeURIComponent(prompt)}</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <ExerciseSuggestionsDisplay 
          suggestions={suggestions}
          onFeedbackChange={handleFeedbackChange}
          onSubmitFeedback={handleSubmitFeedback}
        />
      </div>
    </div>
  );
} 