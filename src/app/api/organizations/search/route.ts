import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { logger } from '@/utils/logger';

// Schema validation for search query
const searchSchema = z.object({
  query: z.string().trim().min(1, 'Search query is required').max(100),
});

/**
 * Search for organizations by name
 */
export async function GET(request: Request) {
  try {
    // Get search query from URL params
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    // Validate query parameter
    try {
      searchSchema.parse({ query });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ 
          error: 'Invalid search query',
          code: 'VALIDATION_ERROR',
          details: error.errors 
        }, { status: 400 });
      }
    }
    
    if (!query) {
      return NextResponse.json({ 
        error: 'Search query is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }
    
    // Authentication check
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.warn('Unauthenticated access attempt to organizations search API');
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'AUTHENTICATION_ERROR' 
      }, { status: 401 });
    }
    
    // Use the dedicated search function
    const { data, error: searchError } = await supabase
      .rpc('search_organizations', { search_term: query });
    
    if (searchError) {
      logger.error('Error searching organizations:', searchError);
      return NextResponse.json({ 
        error: 'Failed to search organizations',
        code: 'DATABASE_ERROR' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: data || []
    });
    
  } catch (error) {
    logger.error('Organization search error:', error);
    
    return NextResponse.json({ 
      error: 'An error occurred while searching organizations',
      code: 'UNEXPECTED_ERROR'
    }, { status: 500 });
  }
} 