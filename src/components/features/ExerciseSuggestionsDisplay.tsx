import { useState } from 'react';
import { ExerciseSuggestion } from '@/types';
import Header from '../layout/Header';
import { motion } from 'framer-motion';

interface ExerciseSuggestionsDisplayProps {
  suggestions: ExerciseSuggestion[];
  // eslint-disable-next-line no-unused-vars
  onFeedbackChange?: (suggestionId: string, score: number, comment?: string) => void;
  onSubmitFeedback?: () => void;
}

// Helper function for text ratings
function getRatingText(score: number): string {
  return ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][score - 1];
}

export default function ExerciseSuggestionsDisplay({ 
  suggestions,
  onFeedbackChange,
  onSubmitFeedback
}: ExerciseSuggestionsDisplayProps) {
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, { score: number; comment?: string }>>({});
  const [error, setError] = useState<{ message: string; componentId?: string } | null>(null);
  const [isRated, setIsRated] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFeedbackChange = (suggestionId: string, score: number, comment?: string) => {
    // If clicking the same score, unselect it
    if (feedback[suggestionId]?.score === score) {
      setFeedback(prev => ({
        ...prev,
        [suggestionId]: { score: 0, comment: prev[suggestionId]?.comment }
      }));
      setIsRated(prev => ({ ...prev, [suggestionId]: false }));
      setActiveSection(prev => ({ ...prev, [suggestionId]: '' }));
      onFeedbackChange?.(suggestionId, 0, comment);
    } else {
      setFeedback(prev => ({
        ...prev,
        [suggestionId]: { score: score, comment: comment }
      }));
      setIsRated(prev => ({ ...prev, [suggestionId]: true }));
      setActiveSection(prev => ({ ...prev, [suggestionId]: 'comment' }));
      onFeedbackChange?.(suggestionId, score, comment);
    }
    setError(null);
  };

  const _handleSubmit = () => {
    const missingRatings = suggestions
      .slice(0, 3)
      .filter(suggestion => !feedback[suggestion.id]?.score)
      .map(suggestion => suggestion.id);

    if (missingRatings.length > 0) {
      setError({
        message: `Please rate ${missingRatings.length} more exercise${missingRatings.length > 1 ? 's' : ''}`,
        componentId: missingRatings[0]
      });
      return;
    }

    setIsSubmitted(true);
    onSubmitFeedback?.();
  };

  const toggleSources = (suggestionId: string) => {
    setExpandedSources(prev => ({
      ...prev,
      [suggestionId]: !prev[suggestionId]
    }));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        progress={Object.keys(feedback).length}
        total={Math.min(suggestions.length, 3)}
        error={error?.message}
        isSubmitted={isSubmitted}
      />
      <motion.div 
        className="flex-1 w-full pt-20 pb-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-4xl font-bold heading-gradient mb-4">
              Your Personalized Exercise Plan
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Based on evidence-based physical therapy practices and clinical guidelines. 
              Each exercise is supported by peer-reviewed research.
            </p>
          </motion.div>
          
          <motion.div 
            className="flex flex-col lg:flex-row justify-center gap-8 lg:gap-12 mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {suggestions.slice(0, 3).map((suggestion, index) => {
              const isErrorComponent = error?.componentId === suggestion.id;
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className={`exercise-card ${
                    isErrorComponent ? 'exercise-card-error' : ''
                  } ${
                    isRated[suggestion.id] ? 'exercise-card-rated' : ''
                  }`}
                >
                  <div className="p-6 flex-1 flex flex-col gap-6">
                    {/* Stage 1: Exercise Info */}
                    <div className="exercise-info">
                      <div className="h-24 flex items-center justify-center">
                        <h3 className="text-2xl font-bold heading-gradient text-center">
                          {suggestion.exercise_name}
                        </h3>
                      </div>
                      
                      <div className="mt-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="exercise-metric">
                            <div className="exercise-metric-label">Sets</div>
                            <div className="exercise-metric-value">{suggestion.sets}</div>
                          </div>
                          <div className="exercise-metric">
                            <div className="exercise-metric-label">Reps</div>
                            <div className="exercise-metric-value">{suggestion.reps}</div>
                          </div>
                        </div>
                        <div className="exercise-metric">
                          <div className="exercise-metric-label">Frequency</div>
                          <div className="exercise-metric-value">{suggestion.frequency}</div>
                        </div>
                      </div>
                    </div>

                    {/* Stage 2: Rating */}
                    <div className="rating-container">
                      <h4 className="rating-title">
                        How helpful is this suggestion?
                      </h4>
                      <div className="rating-scale">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            onClick={() => handleFeedbackChange(suggestion.id, score)}
                            role="radio"
                            aria-checked={feedback[suggestion.id]?.score === score}
                            aria-label={`Rate ${score} out of 5`}
                            className={`rating-button ${
                              feedback[suggestion.id]?.score === score
                                ? 'rating-button-active'
                                : isErrorComponent
                                  ? 'rating-button-error'
                                  : ''
                            }`}
                          >
                            {getRatingText(score)}
                          </button>
                        ))}
                      </div>
                      <div className="rating-label">
                        {feedback[suggestion.id]?.score 
                          ? `You rated this ${feedback[suggestion.id].score} out of 5`
                          : 'Click to rate this suggestion'}
                      </div>
                    </div>

                    {/* Comment Section */}
                    {feedback[suggestion.id]?.score > 0 && (
                      <div className={`
                        transition-all duration-500 transform
                        ${activeSection[suggestion.id] === 'comment' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
                      `}>
                        <label className="label text-center">
                          Want to add more details? (optional)
                        </label>
                        <textarea
                          placeholder="What made this suggestion helpful or not helpful?"
                          value={feedback[suggestion.id]?.comment || ''}
                          onChange={(e) => handleFeedbackChange(
                            suggestion.id,
                            feedback[suggestion.id]?.score || 0,
                            e.target.value
                          )}
                          className="input-field border-cyan-100 rounded-xl focus:ring-cyan-300 focus:border-cyan-300"
                          rows={2}
                        />
                      </div>
                    )}

                    {/* Research Evidence Button */}
                    <button
                      onClick={() => toggleSources(suggestion.id)}
                      className="w-full py-4 px-6 text-base flex items-center justify-between
                               touch-target-min-h-[48px] active:bg-cyan-700
                               hover:shadow-lg transition-all duration-300
                               btn-gradient rounded-lg mt-auto"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Research Evidence
                      </span>
                      <svg 
                        className={`w-5 h-5 transition-transform duration-300 transform ${
                          expandedSources[suggestion.id] ? 'rotate-90' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Research Evidence Content */}
                    {expandedSources[suggestion.id] && (
                      <div className="research-evidence">
                        <p className="research-evidence-title">Supporting Research:</p>
                        <ul className="space-y-3">
                          {suggestion.citations?.map((citation, citationIndex) => (
                            <li key={citationIndex} className="research-evidence-item">
                              <a 
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="research-evidence-link"
                              >
                                {citation.title}
                              </a>
                              <div className="research-evidence-meta">
                                <p>{citation.authors}</p>
                                <p>{citation.journal}, {citation.year}</p>
                                {citation.doi && <p>DOI: {citation.doi}</p>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="text-center text-sm text-gray-600 mb-8">
            <p>All suggestions are based on current evidence-based practices in physical therapy.</p>
            <p className="mt-1">For personalized medical advice, please consult with your healthcare provider.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 