import { createClient } from '@/services/supabase/server';
import { logger } from '@/utils/logger';
import { z } from 'zod';
import {
  createSuccessResponse,
  createAuthErrorResponse,
  createValidationErrorResponse,
  createErrorResponse,
  withErrorHandling
} from '@/utils/api-response';

// Validate environment variables
import '@/config/env';

// Schema validation for search query
const searchSchema = z.object({
  query: z.string().trim().min(1, 'Search query is required').max(100),
});

/**
 * Search for organizations by name
 */
async function handleOrganizationSearch(request: Request) {
  // Get search query from URL params
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  
  // Validate query parameter
  try {
    searchSchema.parse({ query });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(
        'Invalid search query',
        'query',
        error.errors
      );
    }
  }
  
  if (!query) {
    return createValidationErrorResponse(
      'Search query is required',
      'query'
    );
  }
  
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    logger.warn('Unauthenticated access attempt to organizations search API');
    return createAuthErrorResponse();
  }
  
  // Use the dedicated search function
  const { data, error: searchError } = await supabase
    .rpc('search_organizations', { search_term: query });
  
  if (searchError) {
    logger.error('Error searching organizations:', searchError);
    return createErrorResponse(
      'Failed to search organizations',
      500,
      'DATABASE_ERROR',
      searchError.message
    );
  }
  
  return createSuccessResponse(
    data || [],
    `Found ${(data || []).length} organization(s) matching "${query}"`
  );
}

export const GET = withErrorHandling(handleOrganizationSearch); 