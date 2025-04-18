import { z } from 'zod';

export const exerciseSuggestionSchema = z.object({
  exercise_name: z.string().min(1).max(100),
  sets: z.number().int().min(1).max(100),
  reps: z.number().int().min(1).max(100),
  frequency: z.string().min(1).max(100),
});

export const exerciseSuggestionsSchema = z.array(exerciseSuggestionSchema);

export const clinicalKeywords = [
  'ACL', 'LBP', 'knee', 'post-op', 'ROM', 'WBAT', 'quad', 'hamstring',
  'shoulder', 'hip', 'ankle', 'spine', 'neck', 'back', 'pain', 'injury',
  'surgery', 'rehabilitation', 'physical therapy', 'PT', 'strength',
  'flexibility', 'mobility', 'stability', 'balance', 'coordination'
];

export const clinicalInputSchema = z.object({
  prompt: z.string()
    .min(12, 'Please enter at least 12 words')
    .max(500, 'Input is too long')
    .refine(
      text => clinicalKeywords.some(
        keyword => text.toLowerCase().includes(keyword.toLowerCase())
      ),
      'Please include clinical terms'
    )
});

export function validateClinicalInput(input: string): { isValid: boolean; error?: string } {
  try {
    clinicalInputSchema.parse({ prompt: input });
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message
      };
    }
    return {
      isValid: false,
      error: 'Invalid input format'
    };
  }
} 