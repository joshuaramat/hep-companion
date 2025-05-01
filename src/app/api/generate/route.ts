import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { nanoid } from 'nanoid';
import { validateGPTResponse, GPTValidationError, ValidationErrorType } from '@/utils/gpt-validation';
import { retryWithExponentialBackoff, OpenAIAPIError } from '@/utils/retry';
import { z } from 'zod';
import { validateClinicalInput } from '@/services/utils/validation';
import { logger } from '../../../utils/logger';
import { createClient } from '@/services/supabase/server';
import { cookies } from 'next/headers';
import { generatePatientKey } from '@/utils/patient-key';
import { logAudit } from '@/services/audit';

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

const SYSTEM_PROMPT = `You are a physical therapy assistant. Given a clinical scenario, respond with 3-5 exercise suggestions in JSON format. Each item must include:
- exercise_name (string)
- sets (integer)
- reps (integer)
- frequency (string)
- citations (array of objects with title, authors, journal, year, doi, and url)

For each exercise, include 1-2 relevant peer-reviewed research citations from PubMed, JOSPT, or other reputable physical therapy journals. The citations should directly support the exercise parameters (sets, reps, frequency) you're recommending.

Example format:
{
  "exercise_name": "Squat",
  "sets": 3,
  "reps": 12,
  "frequency": "3 times per week",
  "citations": [
    {
      "title": "The Effect of Squat Depth on Lower Extremity Joint Kinematics and Kinetics",
      "authors": "Hartmann H, Wirth K, Klusemann M",
      "journal": "Journal of Strength and Conditioning Research",
      "year": "2013",
      "doi": "10.1519/JSC.0b013e31826d9d7a",
      "url": "https://pubmed.ncbi.nlm.nih.gov/22820210/"
    }
  ]
}

Do not explain the exercises. Do not include instructions. Only output a valid JSON array of suggestions with citations.`;

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
      // Look for anything that looks like a JSON array
      const jsonMatch = cleanResponse.match(/\[\s*{[\s\S]*}\s*\]/);
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

export async function POST(request: Request) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.warn('Unauthenticated access attempt to generate API');
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'AUTHENTICATION_ERROR' 
      }, { status: 401 });
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
        return NextResponse.json(
          { 
            error: errorDetail.message,
            code: 'INPUT_VALIDATION_ERROR',
            field: errorDetail.path.join('.')
          },
          { status: 400 }
        );
      }
      
      // Handle refined validation errors
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Invalid input format',
          code: 'INPUT_VALIDATION_ERROR' 
        },
        { status: 400 }
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
                { role: "system", content: SYSTEM_PROMPT },
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
        const validatedSuggestions = validateGPTResponse(parsedResponse);
        
        // Success path - add IDs to each suggestion
        const suggestionsWithIds = validatedSuggestions.map(suggestion => ({
          ...suggestion,
          id: nanoid(8)
        }));

        // Generate a short ID for the suggestions batch
        const suggestionId = nanoid(8);
        
        logger.info(`Successfully processed suggestions: ${suggestionId}`);
        
        // Store the result in the database with user_id and patient_key
        const { data: promptData, error: insertError } = await supabase
          .from('prompts')
          .insert({
            id: suggestionId,
            prompt_text: prompt,
            raw_gpt_output: suggestionsWithIds,
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
          suggestions_count: suggestionsWithIds.length
        });

        return NextResponse.json({ 
          id: suggestionId,
          suggestions: suggestionsWithIds
        });
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
      return NextResponse.json(
        { 
          error: lastError.message,
          details: lastError.details,
          code: lastError.code || 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }
    
    if (lastError instanceof OpenAIAPIError) {
      return NextResponse.json(
        { 
          error: 'There was a problem connecting to our AI service',
          details: lastError.message,
          code: 'OPENAI_API_ERROR'
        },
        { status: lastError.status || 500 }
      );
    }
    
    if (lastError instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'The exercise suggestions received were incomplete or invalid',
          details: lastError.errors,
          code: 'INPUT_VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }
    
    // Generic fallback error
    return NextResponse.json(
      { 
        error: lastError instanceof Error ? lastError.message : 'Failed to generate suggestions',
        code: 'GENERATION_ERROR'
      },
      { status: 500 }
    );
  } catch (unexpectedError) {
    // Catch-all for any unexpected errors
    logger.error('Unexpected error in generate route:', unexpectedError);
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while processing your request',
        code: 'UNEXPECTED_ERROR'
      },
      { status: 500 }
    );
  }
} 