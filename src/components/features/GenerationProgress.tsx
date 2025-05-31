import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

interface ProgressEvent {
  stage: 'started' | 'fetching-exercises' | 'generating' | 'validating' | 'storing' | 'complete';
  message: string;
  progress: number;
  estimatedTimeRemaining?: number;
  error?: string;
}

interface GenerationProgressProps {
  progressEvent?: ProgressEvent;
  onCancel: () => void;
}

const stageLabels = {
  'started': 'Starting',
  'fetching-exercises': 'Loading Exercise Library',
  'generating': 'Generating Recommendations',
  'validating': 'Validating Results',
  'storing': 'Saving',
  'complete': 'Complete'
};

const stageColors = {
  'started': 'bg-blue-500',
  'fetching-exercises': 'bg-indigo-500',
  'generating': 'bg-purple-500',
  'validating': 'bg-pink-500',
  'storing': 'bg-yellow-500',
  'complete': 'bg-green-500'
};

// Rotating tips to display during generation
const generationTips = [
  "💡 Be specific about pain levels and mobility restrictions for better recommendations",
  "🎯 Including patient age and activity level helps tailor exercises appropriately",
  "📊 Our AI analyzes evidence-based protocols from peer-reviewed journals",
  "⚡ Each exercise recommendation includes proper form and progression notes",
  "🔬 Recommendations are based on the latest physical therapy research",
  "💪 Exercise compliance improves when patients understand the 'why' behind each exercise",
  "📱 Patients can access their exercises from any device",
  "🏃 Progressive overload principles are built into each recommendation"
];

export default function GenerationProgress({ progressEvent, onCancel }: GenerationProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const startTime = useRef(Date.now());
  const generationStartTime = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  // Default values
  const currentStage = progressEvent?.stage || 'started';
  const message = progressEvent?.message || 'Initializing...';
  const baseProgress = progressEvent?.progress || 0;
  const estimatedTime = progressEvent?.estimatedTimeRemaining || null;

  // Rotate tips during generation
  useEffect(() => {
    if (currentStage === 'generating') {
      const tipInterval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % generationTips.length);
      }, 3000); // Change tip every 3 seconds

      return () => clearInterval(tipInterval);
    }
  }, [currentStage]);

  // Animate progress during generation stage
  useEffect(() => {
    if (currentStage === 'generating') {
      if (!generationStartTime.current) {
        generationStartTime.current = Date.now();
      }

      const animate = () => {
        const elapsed = Date.now() - generationStartTime.current!;
        const duration = 10000; // Assume 10 seconds for generation
        
        // Smooth easing function that slows down as it approaches the target
        const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
        const t = Math.min(elapsed / duration, 0.9); // Cap at 90% of the way
        
        // Animate from 40% to 65% during generation
        const progressRange = 25;
        const animatedValue = 40 + (progressRange * easeOutQuart(t));
        
        setAnimatedProgress(animatedValue);
        
        if (t < 0.9) {
          animationFrame.current = requestAnimationFrame(animate);
        }
      };

      animate();

      return () => {
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
      };
    } else if (currentStage === 'validating') {
      // Animate validation stage from 70% to 80%
      const animate = () => {
        const currentValue = animatedProgress;
        const target = 80;
        const diff = target - currentValue;
        
        if (diff > 0.1) {
          setAnimatedProgress(currentValue + diff * 0.05);
          animationFrame.current = requestAnimationFrame(animate);
        }
      };
      
      animate();
      
      return () => {
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
      };
    } else if (currentStage === 'storing') {
      // Animate storing stage from 85% to 95%
      const animate = () => {
        const currentValue = animatedProgress;
        const target = 95;
        const diff = target - currentValue;
        
        if (diff > 0.1) {
          setAnimatedProgress(currentValue + diff * 0.15);
          animationFrame.current = requestAnimationFrame(animate);
        }
      };
      
      animate();
      
      return () => {
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
      };
    } else {
      generationStartTime.current = null;
      setAnimatedProgress(baseProgress);
    }
  }, [currentStage, baseProgress, animatedProgress]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTime.current);
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const getTimeDisplay = () => {
    if (estimatedTime && estimatedTime > 0) {
      return `Est. ${formatTime(estimatedTime)} remaining`;
    }
    return `Elapsed: ${formatTime(elapsedTime)}`;
  };

  // Use animated progress for display
  const displayProgress = currentStage === 'generating' ? Math.floor(animatedProgress) : 
                         currentStage === 'complete' ? 100 : baseProgress;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cancel generation"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentStage === 'complete' ? 'Complete!' : 'Generating Exercises'}
          </h2>
          <p className="text-gray-600 text-sm">
            {message}
          </p>
          {currentStage === 'generating' && (
            <p className="text-xs text-gray-500 mt-2 animate-pulse">
              Analyzing clinical scenario with GPT-4...
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-gray-700">
                  {stageLabels[currentStage]}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-gray-700">
                  {displayProgress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-200">
              <div
                style={{ width: `${displayProgress}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ease-out ${stageColors[currentStage]} ${
                  currentStage === 'generating' ? 'animate-pulse' : ''
                }`}
              />
            </div>
          </div>
        </div>

        {/* Stage indicators */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {Object.entries(stageLabels).map(([stage, label]) => {
            if (stage === 'started' || stage === 'complete') return null;
            
            const stageKey = stage as ProgressEvent['stage'];
            const isActive = currentStage === stageKey;
            const isPassed = getStageOrder(currentStage) > getStageOrder(stageKey);
            
            return (
              <div
                key={stage}
                className={`text-center transition-all duration-300 ${
                  isActive ? 'scale-110' : ''
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full mx-auto mb-1 transition-all duration-300 ${
                    isPassed
                      ? 'bg-green-500'
                      : isActive
                      ? `${stageColors[stageKey]} ${stage === 'generating' ? 'animate-pulse' : ''}`
                      : 'bg-gray-300'
                  } ${isPassed && 'scale-125'}`}
                />
                <span
                  className={`text-xs transition-all duration-300 ${
                    isActive ? 'font-semibold text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Time estimate */}
        <div className="text-center text-sm text-gray-500 mb-4">
          {getTimeDisplay()}
        </div>

        {/* Tips - Show rotating tips during generation */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center transition-all duration-500">
            {currentStage === 'generating' 
              ? generationTips[currentTipIndex]
              : currentStage === 'complete'
              ? '🎉 Your personalized exercise recommendations are ready!'
              : '💡 Pro tip: The more specific your clinical scenario, the better the recommendations!'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

function getStageOrder(stage: ProgressEvent['stage']): number {
  const order = {
    'started': 0,
    'fetching-exercises': 1,
    'generating': 2,
    'validating': 3,
    'storing': 4,
    'complete': 5
  };
  return order[stage] || 0;
} 