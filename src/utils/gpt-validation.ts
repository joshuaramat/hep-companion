import { z } from 'zod';
import { Citation, ExerciseSuggestion, GPTResponse } from '@/types/gpt';

/**
 * Zod schema for validating Citation objects
 */
export const citationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300, 'Title is too long'),
  authors: z.string().min(1, 'Authors are required').max(200, 'Author list is too long'),
  journal: z.string().min(1, 'Journal is required').max(200, 'Journal name is too long'),
  year: z.union([
    z.string().min(4).max(4).regex(/^(19|20)\d{2}$/, 'Year must be a valid year (YYYY)'),
    z.number().int().min(1900).max(new Date().getFullYear() + 1)
  ]),
  doi: z.string().optional().transform(val => val || undefined),
  url: z.string().url('URL must be valid').max(500, 'URL is too long').optional(),
}).strict();

/**
 * Zod schema for validating ExerciseSuggestion objects
 */
export const exerciseSuggestionSchema = z.object({
  exercise_name: z.string().min(1, 'Exercise name is required').max(100, 'Exercise name is too long'),
  sets: z.number().int().positive('Sets must be a positive integer').max(20, 'Sets cannot exceed 20'),
  reps: z.number().int().positive('Reps must be a positive integer').max(100, 'Reps cannot exceed 100'),
  frequency: z.string().min(1, 'Frequency is required').max(100, 'Frequency description is too long'),
  citations: z.array(citationSchema).min(1, 'At least one citation is required').max(5, 'Too many citations'),
  id: z.string().optional(),
}).strict();

/**
 * Zod schema for validating GPT response
 */
export const gptResponseSchema = z.array(exerciseSuggestionSchema)
  .min(1, 'Response must include at least one exercise suggestion')
  .max(10, 'Too many exercise suggestions');

/**
 * Error class for GPT validation issues
 */
export class GPTValidationError extends Error {
  constructor(
    message: string,
    public details?: Record<string, any>,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'GPTValidationError';
  }
}

/**
 * Classification of GPT validation errors for better user feedback
 */
export enum ValidationErrorType {
  MALFORMED_JSON = 'MALFORMED_JSON',
  INVALID_STRUCTURE = 'INVALID_STRUCTURE',
  MISSING_FIELDS = 'MISSING_FIELDS',
  INVALID_DATA_TYPE = 'INVALID_DATA_TYPE',
  EMPTY_RESPONSE = 'EMPTY_RESPONSE',
  OTHER = 'OTHER'
}

/**
 * Classifies the GPT validation error type for better error handling
 */
function classifyValidationError(error: z.ZodError): ValidationErrorType {
  const firstError = error.errors[0];
  
  if (firstError.path.length === 0) {
    return ValidationErrorType.INVALID_STRUCTURE;
  }
  
  if (firstError.message.includes('required')) {
    return ValidationErrorType.MISSING_FIELDS;
  }
  
  if (firstError.message.includes('Expected')) {
    return ValidationErrorType.INVALID_DATA_TYPE;
  }
  
  return ValidationErrorType.OTHER;
}

/**
 * Validates a GPT response against the schema
 * @param data - The data to validate
 * @returns The validated data if valid
 * @throws GPTValidationError if validation fails
 */
export function validateGPTResponse(data: unknown): ExerciseSuggestion[] {
  try {
    // Check if response is empty
    if (!data) {
      throw new GPTValidationError(
        'Empty response received', 
        { errorType: ValidationErrorType.EMPTY_RESPONSE },
        'EMPTY_RESPONSE'
      );
    }
    
    // Check if it's an array
    if (!Array.isArray(data)) {
      throw new GPTValidationError(
        'Invalid response format: expected an array of suggestions', 
        { 
          errorType: ValidationErrorType.INVALID_STRUCTURE,
          receivedType: typeof data 
        },
        'INVALID_STRUCTURE'
      );
    }
    
    // Check if array is empty
    if (data.length === 0) {
      throw new GPTValidationError(
        'No exercise suggestions provided', 
        { errorType: ValidationErrorType.EMPTY_RESPONSE },
        'EMPTY_RESPONSE'
      );
    }
    
    // Check if suggestions exceed maximum count (prevent DOS)
    if (data.length > 10) {
      throw new GPTValidationError(
        'Too many exercise suggestions', 
        { 
          errorType: ValidationErrorType.INVALID_STRUCTURE,
          count: data.length 
        },
        'TOO_MANY_SUGGESTIONS'
      );
    }
    
    // Perform validation against schema
    try {
      return gptResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorType = classifyValidationError(error);
        const details = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        // Generate more user-friendly error messages based on error type
        let message = 'Validation failed for GPT response';
        let code = 'VALIDATION_ERROR';
        
        switch (errorType) {
          case ValidationErrorType.MISSING_FIELDS:
            message = 'The exercise suggestion is missing required fields';
            code = 'MISSING_FIELDS';
            break;
          case ValidationErrorType.INVALID_DATA_TYPE:
            message = 'One or more fields have incorrect data types';
            code = 'INVALID_DATA_TYPE';
            break;
          case ValidationErrorType.INVALID_STRUCTURE:
            message = 'The response structure is invalid';
            code = 'INVALID_STRUCTURE';
            break;
        }
        
        throw new GPTValidationError(message, { details, errorType }, code);
      }
      throw error;
    }
  } catch (error) {
    // If it's already a GPTValidationError, rethrow it
    if (error instanceof GPTValidationError) {
      throw error;
    }
    
    // Otherwise wrap in a GPTValidationError
    throw new GPTValidationError(
      'An error occurred validating the GPT response', 
      {
        originalError: error instanceof Error ? error.message : String(error),
        errorType: ValidationErrorType.OTHER
      },
      'UNKNOWN_ERROR'
    );
  }
} 