import { NextRequest } from 'next/server';
import { OpenAI } from 'openai';
import { GPTValidationError } from '@/utils/gpt-validation';
import { retryWithExponentialBackoff, OpenAIAPIError } from '@/utils/retry';
import { z } from 'zod';
import { validateClinicalInput } from '@/services/utils/validation';
import { logger } from '@/utils/logger';
import { createClient } from '@/services/supabase/server';
import { cookies } from 'next/headers';
import { generatePatientKey } from '@/utils/patient-key';
import { logAudit } from '@/services/audit';
import { GPTResponseSchema } from '@/lib/schemas/gpt-response';
import { getExercises } from '@/services/supabase/exercises';
import '@/config/env';

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Request schema
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
  mrn: z.string().optional(),
  clinic_id: z.string().optional()
});

// Progress event types
type ProgressStage = 'started' | 'fetching-exercises' | 'generating' | 'validating' | 'storing' | 'complete';

interface ProgressEvent {
  stage: ProgressStage;
  message: string;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // in milliseconds
  error?: string;
}

// Helper to send SSE events
function sendSSEEvent(encoder: TextEncoder, controller: ReadableStreamDefaultController, event: ProgressEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  controller.enqueue(encoder.encode(data));
}

// Helper to record timing metrics
async function recordMetric(supabase: any, userId: string, stage: ProgressStage, durationMs: number) {
  try {
    await supabase
      .from('generation_metrics')
      .insert({
        user_id: userId,
        stage,
        duration_ms: durationMs
      });
  } catch (error) {
    logger.error(`Failed to record metric for stage ${stage}:`, error);
  }
}

// Get average timings for progress estimation
async function getStageAverages(supabase: any): Promise<Map<string, number>> {
  try {
    const { data, error } = await supabase.rpc('get_stage_averages');
    if (error) throw error;
    
    const averages = new Map<string, number>();
    data?.forEach((row: any) => {
      averages.set(row.stage, parseInt(row.avg_duration_ms));
    });
    
    // Default estimates if no historical data
    const defaults = new Map([
      ['fetching-exercises', 500],
      ['generating', 3000],
      ['validating', 200],
      ['storing', 300]
    ]);
    
    // Merge with defaults
    defaults.forEach((value, key) => {
      if (!averages.has(key)) {
        averages.set(key, value);
      }
    });
    
    return averages;
  } catch (error) {
    logger.error('Failed to get stage averages:', error);
    // Return defaults on error
    return new Map([
      ['fetching-exercises', 500],
      ['generating', 3000],
      ['validating', 200],
      ['storing', 300]
    ]);
  }
}

// Create system prompt
async function createSystemPrompt(): Promise<string> {
  try {
    const exercises = await getExercises();
    
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

// Clean and parse GPT response
function cleanAndParseGPTResponse(rawResponse: string | null): unknown {
  if (!rawResponse) {
    throw new GPTValidationError('No response content from GPT', undefined, 'EMPTY_RESPONSE');
  }
  
  const cleanResponse = rawResponse
    .replace(/```json\s*|\s*```/g, '')
    .replace(/```\s*|\s*```/g, '')
    .trim();
  
  try {
    return JSON.parse(cleanResponse);
  } catch (error) {
    try {
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Ignore
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

// Validate GPT response
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

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  let abortController: AbortController | null = null;
  
  const stream = new ReadableStream({
    async start(controller) {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);
      const startTime = Date.now();
      let lastStageTime = startTime;
      
      try {
        // Authentication check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          sendSSEEvent(encoder, controller, {
            stage: 'started',
            message: 'Authentication required',
            progress: 0,
            error: 'AUTHENTICATION_ERROR'
          });
          controller.close();
          return;
        }
        
        // Parse and validate request
        const body = await request.json().catch(() => {
          throw new Error('Invalid JSON in request body');
        });
        
        try {
          requestSchema.parse(body);
        } catch (error) {
          const message = error instanceof z.ZodError ? error.errors[0].message : 'Invalid input';
          sendSSEEvent(encoder, controller, {
            stage: 'started',
            message,
            progress: 0,
            error: 'VALIDATION_ERROR'
          });
          controller.close();
          return;
        }
        
        const { prompt, mrn, clinic_id } = body;
        
        // Get stage averages for time estimation
        const stageAverages = await getStageAverages(supabase);
        const totalEstimatedTime = Array.from(stageAverages.values()).reduce((a, b) => a + b, 0);
        
        // Stage 1: Started
        sendSSEEvent(encoder, controller, {
          stage: 'started',
          message: 'Starting exercise generation...',
          progress: 5,
          estimatedTimeRemaining: totalEstimatedTime
        });
        
        // Stage 2: Fetching exercises
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UI
        const fetchStartTime = Date.now();
        
        sendSSEEvent(encoder, controller, {
          stage: 'fetching-exercises',
          message: 'Loading exercise library...',
          progress: 15,
          estimatedTimeRemaining: totalEstimatedTime - 100
        });
        
        const systemPrompt = await createSystemPrompt();
        const fetchDuration = Date.now() - fetchStartTime;
        await recordMetric(supabase, user.id, 'fetching-exercises', fetchDuration);
        
        // Stage 3: Generating with GPT
        const generateStartTime = Date.now();
        
        sendSSEEvent(encoder, controller, {
          stage: 'generating',
          message: 'Generating personalized exercises...',
          progress: 40,
          estimatedTimeRemaining: totalEstimatedTime - fetchDuration - 100
        });
        
        // Create abort controller for cancellation
        abortController = new AbortController();
        
        // Send periodic progress updates during generation
        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - generateStartTime;
          const estimatedGenerationTime = stageAverages.get('generating') || 3000;
          
          // Calculate smooth progress from 40% to 65% during generation
          const progressRatio = Math.min(elapsed / estimatedGenerationTime, 0.9);
          const currentProgress = 40 + Math.floor(25 * progressRatio);
          
          sendSSEEvent(encoder, controller, {
            stage: 'generating',
            message: 'Analyzing your clinical scenario...',
            progress: currentProgress,
            estimatedTimeRemaining: Math.max(0, totalEstimatedTime - fetchDuration - elapsed - 100)
          });
        }, 1000); // Update every second
        
        try {
          const completion = await retryWithExponentialBackoff(async () => {
            const result = await openai.chat.completions.create({
              model: "gpt-4",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 1000
              // Note: OpenAI SDK doesn't support AbortController signals directly
            });
            
            return result;
          });
          
          // Clear the progress interval
          clearInterval(progressInterval);
          
          const generateDuration = Date.now() - generateStartTime;
          await recordMetric(supabase, user.id, 'generating', generateDuration);
          
          // Stage 4: Validating
          const validateStartTime = Date.now();
          
          sendSSEEvent(encoder, controller, {
            stage: 'validating',
            message: 'Validating exercise recommendations...',
            progress: 70,
            estimatedTimeRemaining: stageAverages.get('validating')! + stageAverages.get('storing')!
          });
          
          const response = completion.choices[0].message.content;
          const parsedResponse = cleanAndParseGPTResponse(response);
          
          // Small delay to make validation visible
          await new Promise(resolve => setTimeout(resolve, 300));
          
          sendSSEEvent(encoder, controller, {
            stage: 'validating',
            message: 'Checking exercise format...',
            progress: 75,
            estimatedTimeRemaining: stageAverages.get('storing')!
          });
          
          const validatedResponse = validateGPTResponseWithSchema(parsedResponse);
          
          const validateDuration = Date.now() - validateStartTime;
          await recordMetric(supabase, user.id, 'validating', validateDuration);
          
          // Stage 5: Storing
          const storeStartTime = Date.now();
          
          sendSSEEvent(encoder, controller, {
            stage: 'storing',
            message: 'Saving recommendations...',
            progress: 85,
            estimatedTimeRemaining: stageAverages.get('storing')!
          });
          
          // Generate IDs
          const suggestionId = crypto.randomUUID();
          const exercisesWithIds = validatedResponse.exercises.map(exercise => ({
            ...exercise,
            id: crypto.randomUUID()
          }));
          
          const responseData = {
            ...validatedResponse,
            exercises: exercisesWithIds,
            id: suggestionId
          };
          
          // Small delay to make storing visible
          await new Promise(resolve => setTimeout(resolve, 200));
          
          sendSSEEvent(encoder, controller, {
            stage: 'storing',
            message: 'Finalizing...',
            progress: 92,
            estimatedTimeRemaining: 200
          });
          
          // Generate patient key if provided
          let patientKey: string | undefined;
          if (mrn && clinic_id) {
            patientKey = generatePatientKey(mrn, clinic_id);
          }
          
          // Store in database
          const { error: insertError } = await supabase
            .from('prompts')
            .insert({
              id: suggestionId,
              prompt_text: prompt,
              raw_gpt_output: responseData,
              user_id: user.id,
              patient_key: patientKey
            });
            
          if (insertError) {
            throw new Error(`Failed to store suggestions: ${insertError.message}`);
          }
          
          const storeDuration = Date.now() - storeStartTime;
          await recordMetric(supabase, user.id, 'storing', storeDuration);
          
          // Log audit
          await logAudit('generate', 'prompt', suggestionId, {
            has_patient_key: !!patientKey,
            exercises_count: exercisesWithIds.length,
            confidence_level: validatedResponse.confidence_level
          });
          
          // Stage 6: Complete
          sendSSEEvent(encoder, controller, {
            stage: 'complete',
            message: 'Exercise generation complete!',
            progress: 100
          });
          
          // Small delay before sending final data
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Send the final data
          const finalData = `data: ${JSON.stringify({ type: 'result', data: responseData })}\n\n`;
          controller.enqueue(encoder.encode(finalData));
          
          const totalDuration = Date.now() - startTime;
          await recordMetric(supabase, user.id, 'complete', totalDuration);
          
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      } catch (error) {
        logger.error('Error in SSE stream:', error);
        
        let errorMessage = 'An unexpected error occurred';
        let errorCode = 'SERVER_ERROR';
        
        if (error instanceof GPTValidationError) {
          errorMessage = error.message;
          errorCode = error.code || 'VALIDATION_ERROR';
        } else if (error instanceof OpenAIAPIError) {
          errorMessage = 'There was a problem connecting to our AI service';
          errorCode = 'OPENAI_API_ERROR';
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        sendSSEEvent(encoder, controller, {
          stage: 'started',
          message: errorMessage,
          progress: 0,
          error: errorCode
        });
      } finally {
        controller.close();
      }
    },
    
    cancel() {
      // Handle cancellation
      if (abortController) {
        abortController.abort();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 