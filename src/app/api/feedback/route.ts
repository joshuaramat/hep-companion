import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/services/supabase/server';
import { cookies } from 'next/headers';
import { logAudit } from '@/services/audit';
import { logger } from '@/utils/logger';

// Schema validation for feedback
const feedbackSchema = z.object({
  prompt_id: z.string().uuid('Invalid prompt ID format'),
  suggestion_id: z.string().min(1, 'Suggestion ID is required'),
  relevance_score: z.number().int().min(1, 'Score must be at least 1').max(5, 'Score cannot exceed 5'),
  comment: z.string().optional()
});

export async function POST(request: Request) {
  try {
    // Authentication check
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.warn('Unauthenticated access attempt to feedback API');
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'AUTHENTICATION_ERROR' 
      }, { status: 401 });
    }
    
    // Parse and validate request
    const body = await request.json().catch(() => {
      throw new Error('Invalid JSON in request body');
    });
    
    try {
      feedbackSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetail = error.errors[0];
        return NextResponse.json(
          { 
            error: errorDetail.message,
            code: 'VALIDATION_ERROR',
            field: errorDetail.path.join('.')
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Invalid feedback format',
          code: 'VALIDATION_ERROR' 
        },
        { status: 400 }
      );
    }
    
    const { prompt_id, suggestion_id, relevance_score, comment } = body;
    
    // Verify that the prompt belongs to the user
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('id, user_id')
      .eq('id', prompt_id)
      .single();
      
    if (promptError || !promptData) {
      return NextResponse.json({ 
        error: 'Prompt not found', 
        code: 'RESOURCE_ERROR' 
      }, { status: 404 });
    }
    
    if (promptData.user_id !== user.id) {
      logger.warn(`Unauthorized feedback attempt: User ${user.id} attempted to provide feedback for prompt ${prompt_id}`);
      return NextResponse.json({ 
        error: 'Unauthorized access to this prompt', 
        code: 'AUTHORIZATION_ERROR' 
      }, { status: 403 });
    }
    
    // Save feedback
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        prompt_id,
        suggestion_id,
        relevance_score,
        comment,
        user_id: user.id
      })
      .select()
      .single();
      
    if (feedbackError) {
      logger.error(`Error inserting feedback: ${feedbackError.message}`);
      throw new Error(`Failed to save feedback: ${feedbackError.message}`);
    }
    
    // Log audit
    await logAudit('feedback', 'feedback', feedbackData.id, {
      prompt_id,
      suggestion_id,
      score: relevance_score
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: feedbackData.id,
        prompt_id,
        suggestion_id,
        relevance_score
      }
    });
  } catch (error) {
    logger.error('Feedback submission error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'An error occurred while saving feedback',
      code: 'UNEXPECTED_ERROR'
    }, { status: 500 });
  }
} 