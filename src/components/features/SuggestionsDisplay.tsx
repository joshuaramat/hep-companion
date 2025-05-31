import React from 'react';

interface Exercise {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  notes?: string;
  evidence_source?: string;
  description?: string;
}

interface SuggestionsDisplayProps {
  promptId: string;
  prompt: string;
  suggestions: Exercise[];
  clinicalNotes?: string;
  citations?: string[];
  confidenceLevel?: string;
}

export default function SuggestionsDisplay({
  promptId,
  prompt,
  suggestions,
  clinicalNotes,
  citations,
  confidenceLevel
}: SuggestionsDisplayProps) {
  const getConfidenceColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'text-green-700 bg-green-50/70 border-green-300';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50/70 border-yellow-300';
      case 'low':
        return 'text-orange-700 bg-orange-50/70 border-orange-300';
      default:
        return 'text-gray-600 bg-gray-50/70 border-gray-300';
    }
  };

  return (
    <>
      {/* Clinical Scenario */}
      <div className="mb-8 bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Your Clinical Scenario</h2>
        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{prompt}</p>
      </div>

      {/* Clinical Notes */}
      {clinicalNotes && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Clinical Reasoning</h3>
            {/* AI Confidence Level - now smaller and integrated */}
            {confidenceLevel && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(confidenceLevel)}`}>
                <svg 
                  className="w-3.5 h-3.5" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="capitalize">{confidenceLevel} AI confidence</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 leading-relaxed">{clinicalNotes}</p>
        </div>
      )}

      {/* Clinical Notes without confidence level (when no clinical notes but confidence exists) */}
      {!clinicalNotes && confidenceLevel && (
        <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(confidenceLevel)}`}>
            <svg 
              className="w-3.5 h-3.5" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>AI Confidence: <span className="capitalize">{confidenceLevel}</span></span>
          </div>
        </div>
      )}

      {/* Exercise Recommendations */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Recommended Exercises ({suggestions.length})
        </h2>
        
        <div className="space-y-6">
          {suggestions.map((exercise, index) => (
            <div
              key={exercise.id || index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {index + 1}. {exercise.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Sets: {exercise.sets}</span>
                    <span>Reps: {exercise.reps}</span>
                  </div>
                </div>

                {exercise.description && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                    <p className="text-gray-600">{exercise.description}</p>
                  </div>
                )}

                {exercise.notes && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Special Instructions</h4>
                    <p className="text-gray-600">{exercise.notes}</p>
                  </div>
                )}

                {exercise.evidence_source && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Evidence Source:</span> {exercise.evidence_source}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Citations */}
      {citations && citations.length > 0 && (
        <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">References</h3>
          <ul className="space-y-2">
            {citations.map((citation, index) => (
              <li key={index} className="text-sm text-gray-600">
                {index + 1}. {citation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Generation ID */}
      <div className="mt-6 text-center text-xs text-gray-400">
        Generation ID: {promptId}
      </div>
    </>
  );
} 