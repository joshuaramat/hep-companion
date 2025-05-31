import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { GPTValidationError, ValidationErrorType } from '@/utils/gpt-validation';
import { retryWithExponentialBackoff, OpenAIAPIError } from '@/utils/retry';
import { z } from 'zod';
import { validateClinicalInput } from '@/services/utils/validation';
import { logger } from '../../../utils/logger';
import { createClient } from '@/services/supabase/server';
import { cookies } from 'next/headers';
import { generatePatientKey } from '@/utils/patient-key';
import { logAudit } from '@/services/audit';
import {
  createAuthErrorResponse,
  createValidationErrorResponse,
  createServerErrorResponse,
  createErrorResponse
} from '@/utils/api-response';
import { GPTResponseSchema } from '@/lib/schemas/gpt-response';
import { getExercises } from '@/services/supabase/exercises';

// Validate environment variables
import '@/config/env';

// Max attempts for GPT parsing/validation
const MAX_PROCESSING_ATTEMPTS = 2;

// Create OpenAI client with API key verification
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Verify API key is present
if (!process.env.OPENAI_API_KEY) {
  logger.error('OPENAI_API_KEY environment variable is not set');
}

// Function to create system prompt with exercise library
async function createSystemPrompt(): Promise<string> {
  try {
    // Fetch all exercises from the database
    const exercises = await getExercises();
    
    // Format exercises for inclusion in prompt
    const exerciseLibrary = exercises.map(ex => ({
      name: ex.name,
      condition: ex.condition,
      description: ex.description,
      evidence_source: `${ex.journal}, ${ex.year}${ex.doi ? ` (DOI: ${ex.doi})` : ''}`
    }));

    return `You are an expert physical therapy assistant with access to an evidence-based exercise library. 

AVAILABLE EXERCISES:
${JSON.stringify(exerciseLibrary, null, 2)}

Given a clinical scenario, provide a personalized exercise program following this EXACT JSON format:

{
  "exercises": [
    {
      "name": "Exercise name from the library",
      "sets": 3,
      "reps": "10-12",
      "notes": "Optional specific instructions",
      "evidence_source": "Full citation from the exercise library"
    }
  ],
  "clinical_notes": "Brief clinical reasoning for this program",
  "citations": [
    "Full citation 1",
    "Full citation 2"
  ],
  "confidence_level": "high" // or "medium" or "low"
}

IMPORTANT REQUIREMENTS:
1. Only recommend exercises from the provided library
2. Each exercise MUST include the evidence_source field with the exact citation from the library
3. The citations array should list all unique citations used
4. Provide 3-5 exercises appropriate for the condition
5. Include clinical reasoning in clinical_notes
6. Assess your confidence level based on how well the available exercises match the patient's needs

Do not include any text outside the JSON structure.`;
  } catch (error) {
    logger.error('Failed to fetch exercise library:', error);
    // Fallback to basic prompt if database is unavailable
    return `You are a physical therapy assistant. Given a clinical scenario, respond with 3-5 exercise suggestions in JSON format following this structure:

{
  "exercises": [
    {
      "name": "Exercise name",
      "sets": 3,
      "reps": "10-12",
      "notes": "Optional notes",
      "evidence_source": "Citation"
    }
  ],
  "clinical_notes": "Clinical reasoning",
  "citations": ["Citation 1", "Citation 2"],
  "confidence_level": "medium"
}`;
  }
}

// Enhanced schema for validating the incoming request
const requestSchema = z.object({
  prompt: z.string()
    .min(20, 'Please provide more detailed information about the patient (at least 20 characters)')
    .max(1000, 'Prompt is too long, please be more concise')
    .refine(input => {
      const { isValid, error } = validateClinicalInput(input);
      if (!isValid) {
        throw new Error(error);
      }
      return true;
    }, {
      message: 'Your input does not contain sufficient clinical information'
    }),
  mrn: z.string().optional(), // Optional for now, but will be required in the future
  clinic_id: z.string().optional() // Optional for now, but will be required in the future
});

// Helper to clean and parse GPT responses
function cleanAndParseGPTResponse(rawResponse: string | null): unknown {
  if (!rawResponse) {
    throw new GPTValidationError('No response content from GPT', undefined, 'EMPTY_RESPONSE');
  }
  
  // Clean the response - strip markdown code blocks, whitespace, and other artifacts
  const cleanResponse = rawResponse
    .replace(/```json\s*|\s*```/g, '') // Remove json code blocks
    .replace(/```\s*|\s*```/g, '')     // Remove any other code blocks
    .trim();
  
  try {
    return JSON.parse(cleanResponse);
  } catch (error) {
    // Attempt more aggressive cleaning if standard cleaning failed
    try {
      // Look for anything that looks like a JSON object (not array)
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If aggressive parsing fails, just throw the original error
    }
    
    throw new GPTValidationError(
      'Failed to parse GPT response as JSON', 
      { 
        rawResponse: cleanResponse.substring(0, 200) + (cleanResponse.length > 200 ? '...' : ''),
        parseError: error instanceof Error ? error.message : String(error)
      },
      'PARSE_ERROR'
    );
  }
}

// New validation function using GPTResponseSchema
function validateGPTResponseWithSchema(data: unknown): z.infer<typeof GPTResponseSchema> {
  try {
    return GPTResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const errorMessage = `Invalid response format: ${firstError.message} at ${firstError.path.join('.')}`;
      
      throw new GPTValidationError(
        errorMessage,
        {
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        'VALIDATION_ERROR'
      );
    }
    throw error;
  }
}

async function handleGenerate(request: Request) {
  // Check authentication
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    logger.warn('Unauthenticated access attempt to generate API');
    return createAuthErrorResponse();
  }
  
  // Parse and validate the request body
  const body = await request.json().catch(() => {
    throw new Error('Invalid JSON in request body');
  });
  
  try {
    requestSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetail = error.errors[0];
      return createValidationErrorResponse(
        errorDetail.message,
        errorDetail.path.join('.'),
        error.errors
      );
    }
    
    // Handle refined validation errors
    return createValidationErrorResponse(
      error instanceof Error ? error.message : 'Invalid input format'
    );
  }
  
  const { prompt, mrn, clinic_id } = body;
  
  // Generate patient key if MRN and clinic_id are provided
  let patientKey: string | undefined;
  if (mrn && clinic_id) {
    patientKey = generatePatientKey(mrn, clinic_id);
  }
  
  // Track attempts to process GPT response
  let attemptCount = 0;
  let lastError: Error | null = null;
  
  while (attemptCount < MAX_PROCESSING_ATTEMPTS) {
    attemptCount++;
    
    try {
      // Call OpenAI API with retry logic for network/API errors
      const completion = await retryWithExponentialBackoff(async () => {
        try {
          const startTime = Date.now();
          logger.info(`Starting GPT API call for prompt: ${prompt.substring(0, 50)}...`);
          
          const result = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              { role: "system", content: await createSystemPrompt() },
              { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000, // Prevent unreasonably long responses
          });
          
          const duration = Date.now() - startTime;
          logger.info(`GPT API call completed in ${duration}ms`);
          
          return result;
        } catch (error: any) {
          // Enhanced error classification for OpenAI errors
          const status = error.status || 500;
          const message = error.message || 'Error calling OpenAI API';
          
          // Classify which errors should be retried
          const retryable = 
            status === 429 || // Rate limiting
            status === 503 || // Service unavailable 
            status === 500 || // Server error
            /timeout|timed? out/i.test(message); // Timeout errors
            
          logger.error(`OpenAI API error: ${message} (${status}), retryable: ${retryable}`);
          
          throw new OpenAIAPIError(message, status, retryable);
        }
      });

      const response = completion.choices[0].message.content;
      
      // Parse and validate the response
      const parsedResponse = cleanAndParseGPTResponse(response);
      const validatedResponse = validateGPTResponseWithSchema(parsedResponse);
      
      // Success path - generate UUID for the batch
      const suggestionId = crypto.randomUUID();
      
      // Add UUIDs to each exercise suggestion
      const exercisesWithIds = validatedResponse.exercises.map(exercise => ({
        ...exercise,
        id: crypto.randomUUID()
      }));
      
      // Prepare response data
      const responseData = {
        ...validatedResponse,
        exercises: exercisesWithIds,
        id: suggestionId
      };
      
      logger.info(`Successfully processed suggestions: ${suggestionId}`);
      
      // Store the result in the database with user_id and patient_key
      const { data: promptData, error: insertError } = await supabase
        .from('prompts')
        .insert({
          id: suggestionId,
          prompt_text: prompt,
          raw_gpt_output: responseData,
          user_id: user.id,
          patient_key: patientKey
        })
        .select()
        .single();
        
      if (insertError) {
        logger.error(`Error inserting prompt data: ${insertError.message}`);
        throw new Error(`Failed to store suggestions: ${insertError.message}`);
      }
      
      // Log audit event
      await logAudit('generate', 'prompt', suggestionId, {
        has_patient_key: !!patientKey,
        exercises_count: exercisesWithIds.length,
        confidence_level: validatedResponse.confidence_level
      });

      // Return the response data directly
      return NextResponse.json(responseData);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If this is a validation error that can't be fixed by retrying, break immediately
      if (error instanceof GPTValidationError && 
          error.code !== 'PARSE_ERROR' && 
          error.code !== 'EMPTY_RESPONSE') {
        break;
      }
      
      // Log the error but continue to next attempt if we have attempts left
      logger.warn(`Processing attempt ${attemptCount} failed: ${lastError.message}`);
      
      // Only continue if we have attempts left
      if (attemptCount >= MAX_PROCESSING_ATTEMPTS) {
        break;
      }
    }
  }
  
  // If we get here, all attempts failed
  logger.error(`All ${attemptCount} processing attempts failed for prompt`);
  
  // Return appropriate error response based on the last error
  if (lastError instanceof GPTValidationError) {
    return createErrorResponse(
      lastError.message,
      400,
      lastError.code || 'VALIDATION_ERROR',
      JSON.stringify(lastError.details)
    );
  }
  
  if (lastError instanceof OpenAIAPIError) {
    return createErrorResponse(
      'There was a problem connecting to our AI service',
      lastError.status || 500,
      'OPENAI_API_ERROR',
      lastError.message
    );
  }
  
  if (lastError instanceof z.ZodError) {
    return createErrorResponse(
      'The exercise suggestions received were incomplete or invalid',
      400,
      'INPUT_VALIDATION_ERROR',
      JSON.stringify(lastError.errors)
    );
  }
  
  // Generic fallback error
  return createServerErrorResponse(
    lastError instanceof Error ? lastError.message : 'Failed to generate suggestions'
  );
}

export async function POST(request: Request) {
  return handleGenerate(request);
} 