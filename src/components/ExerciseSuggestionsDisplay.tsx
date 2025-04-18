import { useState } from 'react';
import { ExerciseSuggestion } from '@/types';

interface ExerciseSuggestionsDisplayProps {
  suggestions: ExerciseSuggestion[];
  onFeedbackChange?: (suggestionId: string, score: number, comment?: string) => void;
}

// Sample exercise-specific research articles
const RESEARCH_ARTICLES = {
  'squat': [
    {
      title: 'The Effect of Squat Depth on Lower Extremity Joint Kinematics and Kinetics',
      authors: 'Hartmann H, Wirth K, Klusemann M',
      journal: 'Journal of Strength and Conditioning Research',
      year: '2013',
      doi: '10.1519/JSC.0b013e31826d9d7a',
      url: 'https://pubmed.ncbi.nlm.nih.gov/22820210/'
    },
    {
      title: 'Biomechanical Analysis of the Squat Exercise',
      authors: 'Escamilla RF, Fleisig GS, Zheng N, et al.',
      journal: 'Medicine & Science in Sports & Exercise',
      year: '2001',
      doi: '10.1097/00005768-200101000-00013',
      url: 'https://pubmed.ncbi.nlm.nih.gov/11194098/'
    }
  ],
  'push-up': [
    {
      title: 'Muscle Activation During Push-Ups with Different Suspension Training Systems',
      authors: 'Calatayud J, Borreani S, Colado JC, et al.',
      journal: 'Journal of Sports Science & Medicine',
      year: '2014',
      doi: '10.52082/jssm.2014.502',
      url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4127517/'
    }
  ],
  'plank': [
    {
      title: 'Core Muscle Activation During Swiss Ball and Traditional Abdominal Exercises',
      authors: 'Escamilla RF, Babb E, DeWitt R, et al.',
      journal: 'Journal of Orthopaedic & Sports Physical Therapy',
      year: '2010',
      doi: '10.2519/jospt.2010.3073',
      url: 'https://pubmed.ncbi.nlm.nih.gov/20710095/'
    }
  ],
  'default': [
    {
      title: 'Evidence-Based Physical Therapy Practice',
      authors: 'Jette AM',
      journal: 'Physical Therapy',
      year: '2005',
      doi: '10.1093/ptj/85.3.209',
      url: 'https://pubmed.ncbi.nlm.nih.gov/15733046/'
    },
    {
      title: 'Clinical Practice Guidelines for Physical Therapy',
      authors: 'APTA Clinical Practice Guidelines',
      journal: 'American Physical Therapy Association',
      year: '2023',
      url: 'https://www.apta.org/patient-care/evidence-based-practice-resources/clinical-practice-guidelines'
    }
  ]
};

export default function ExerciseSuggestionsDisplay({ 
  suggestions,
  onFeedbackChange 
}: ExerciseSuggestionsDisplayProps) {
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, { score: number; comment?: string }>>({});

  const handleFeedbackChange = (suggestionId: string, score: number, comment?: string) => {
    setFeedback(prev => ({
      ...prev,
      [suggestionId]: { score, comment }
    }));
    onFeedbackChange?.(suggestionId, score, comment);
  };

  const toggleSources = (suggestionId: string) => {
    setExpandedSources(prev => ({
      ...prev,
      [suggestionId]: !prev[suggestionId]
    }));
  };

  const getExerciseArticles = (exerciseName: string) => {
    const exerciseKey = exerciseName.toLowerCase();
    const key = Object.keys(RESEARCH_ARTICLES).find(k => exerciseKey.includes(k)) || 'default';
    return RESEARCH_ARTICLES[key as keyof typeof RESEARCH_ARTICLES];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Recommended Exercises
        </h2>
        <p className="text-gray-600">
          Based on evidence-based physical therapy practices and clinical guidelines
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suggestions.map((suggestion, index) => {
          const articles = getExerciseArticles(suggestion.exercise_name);
          
          return (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  {suggestion.exercise_name}
                </h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24">Sets:</span>
                    <span className="font-medium text-gray-800">{suggestion.sets}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24">Reps:</span>
                    <span className="font-medium text-gray-800">{suggestion.reps}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24">Frequency:</span>
                    <span className="font-medium text-gray-800">{suggestion.frequency}</span>
                  </div>
                </div>

                {/* Sources Section */}
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <button
                    onClick={() => toggleSources(index.toString())}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    View Supporting Research
                  </button>
                  
                  {expandedSources[index.toString()] && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p className="mb-2">This exercise is supported by peer-reviewed research:</p>
                      <ul className="space-y-3">
                        {suggestion.citations?.map((citation, citationIndex) => (
                          <li key={citationIndex} className="border-l-2 border-indigo-200 pl-3">
                            <a 
                              href={citation.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              {citation.title}
                            </a>
                            <div className="text-xs text-gray-500 mt-1">
                              <p>{citation.authors}</p>
                              <p>{citation.journal}, {citation.year}</p>
                              {citation.doi && <p>DOI: {citation.doi}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-gray-500">
                        Note: These are research-based references. For specific clinical guidance, please consult with your healthcare provider.
                      </p>
                    </div>
                  )}
                </div>

                {/* Feedback Section */}
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      How relevant is this exercise for your needs?
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={feedback[index]?.score || 3}
                      onChange={(e) => handleFeedbackChange(index.toString(), parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Not Relevant</span>
                      <span>Very Relevant</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`comment-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes (optional)
                    </label>
                    <textarea
                      id={`comment-${index}`}
                      value={feedback[index]?.comment || ''}
                      onChange={(e) => handleFeedbackChange(index.toString(), feedback[index]?.score || 3, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={2}
                      placeholder="Any specific notes about this exercise..."
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>All suggestions are based on current evidence-based practices in physical therapy.</p>
        <p className="mt-1">For personalized medical advice, please consult with your healthcare provider.</p>
      </div>
    </div>
  );
} 