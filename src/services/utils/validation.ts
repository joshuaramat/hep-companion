import { z } from 'zod';

export const exerciseSuggestionSchema = z.object({
  exercise_name: z.string().min(1).max(100),
  sets: z.number().int().min(1).max(100),
  reps: z.number().int().min(1).max(100),
  frequency: z.string().min(1).max(100),
});

export const exerciseSuggestionsSchema = z.array(exerciseSuggestionSchema);

// Enhanced list of clinical keywords for better detection of valid PT content
export const clinicalKeywords = [
  // Conditions and anatomical terms
  'ACL', 'LBP', 'knee', 'shoulder', 'hip', 'ankle', 'spine', 'neck', 'back', 'elbow', 'wrist',
  'cervical', 'thoracic', 'lumbar', 'sacral', 'TMJ', 'patellofemoral', 'meniscus', 'rotator cuff',
  'tendinopathy', 'tendinitis', 'bursitis', 'arthritis', 'osteoarthritis', 'scoliosis',
  'sciatica', 'radicular', 'radiculopathy', 'neuropathy', 'impingement',
  
  // Clinical terms
  'post-op', 'post-surgical', 'rehabilitation', 'prehabilitation', 'ROM', 'WBAT', 'TTWB', 'NWB',
  'FWB', 'PWB', 'quad', 'hamstring', 'pain', 'injury', 'surgery', 'physical therapy', 'PT',
  'strength', 'flexibility', 'mobility', 'stability', 'balance', 'coordination', 'gait',
  'proprioception', 'kinesthesia', 'AROM', 'PROM', 'AAROM', 'ATNR', 'MMT',
  
  // Therapeutic approaches
  'strengthening', 'stretching', 'mobilization', 'manipulation', 'neuromuscular', 
  'plyometric', 'isometric', 'isotonic', 'isokinetic', 'eccentric', 'concentric',
  'closed-chain', 'open-chain', 'therapeutic exercise', 'manual therapy',
  
  // Assessment terms
  'evaluation', 'assessment', 'testing', 'functional', 'musculoskeletal', 'neurological',
  'orthopedic', 'sports', 'geriatric', 'pediatric', 'vestibular', 'proprioceptive'
];

// Enhanced clinical input validation
export const clinicalInputSchema = z.object({
  prompt: z.string()
    .min(20, 'Please provide more detailed clinical information (at least 20 characters)')
    .max(500, 'Input is too long')
    .refine(
      text => {
        // Count meaningful clinical keywords
        const keywordCount = clinicalKeywords.filter(
          keyword => text.toLowerCase().includes(keyword.toLowerCase())
        ).length;
        
        // Requires at least 2 clinical keywords
        return keywordCount >= 2;
      },
      'Please include specific clinical terms and patient details'
    )
    .refine(
      text => {
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        return wordCount >= 8;
      },
      'Please describe the clinical scenario in more detail (at least 8 words)'
    )
});

export function validateClinicalInput(input: string): { isValid: boolean; error?: string; details?: string } {
  try {
    clinicalInputSchema.parse({ prompt: input });
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Provide more detailed feedback based on error type
      const errorMessage = error.errors[0].message;
      let details = '';
      
      if (errorMessage.includes('clinical terms')) {
        details = 'Try including specific information about the condition, body part, or treatment goals.';
      } else if (errorMessage.includes('at least 8 words')) {
        details = 'Please provide more context about the patient\'s condition and needs.';
      }
      
      return {
        isValid: false,
        error: errorMessage,
        details
      };
    }
    return {
      isValid: false,
      error: 'Invalid input format',
      details: 'The input could not be processed. Please try again with a different format.'
    };
  }
} 