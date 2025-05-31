import { NextResponse } from 'next/server';
import { logger } from './logger';

// Standard API response format
export interface ApiResponse<T = any> {
  ok: boolean;
  message: string;
  data?: T;
  error?: string;
  code?: string;
}

// Success response helper
export function createSuccessResponse<T>(
  data: T,
  message: string = 'Operation successful',
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    ok: true,
    message,
    data
  };
  
  return NextResponse.json(response, { status });
}

// Error response helper
export function createErrorResponse(
  message: string,
  status: number = 500,
  code?: string,
  error?: string
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    ok: false,
    message,
    ...(code && { code }),
    ...(error && { error })
  };
  
  // Log error for monitoring
  logger.error(`API Error [${status}]: ${message}`, {
    code,
    error,
    status
  });
  
  return NextResponse.json(response, { status });
}

// Validation error response helper
export function createValidationErrorResponse(
  message: string,
  field?: string,
  details?: any
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    ok: false,
    message,
    code: 'VALIDATION_ERROR',
    ...(field && { error: `Validation failed for field: ${field}` }),
    ...(details && { data: details })
  };
  
  logger.warn(`Validation Error: ${message}`, { field, details });
  
  return NextResponse.json(response, { status: 400 });
}

// Authentication error response
export function createAuthErrorResponse(
  message: string = 'Authentication required'
): NextResponse<ApiResponse> {
  return createErrorResponse(message, 401, 'AUTHENTICATION_ERROR');
}

// Authorization error response
export function createAuthzErrorResponse(
  message: string = 'Insufficient permissions'
): NextResponse<ApiResponse> {
  return createErrorResponse(message, 403, 'AUTHORIZATION_ERROR');
}

// Not found error response
export function createNotFoundResponse(
  resource: string = 'Resource'
): NextResponse<ApiResponse> {
  return createErrorResponse(`${resource} not found`, 404, 'NOT_FOUND');
}

// Rate limit error response
export function createRateLimitResponse(
  message: string = 'Rate limit exceeded'
): NextResponse<ApiResponse> {
  return createErrorResponse(message, 429, 'RATE_LIMIT_EXCEEDED');
}

// Server error response
export function createServerErrorResponse(
  message: string = 'Internal server error',
  error?: string
): NextResponse<ApiResponse> {
  return createErrorResponse(message, 500, 'INTERNAL_SERVER_ERROR', error);
}

// Helper to wrap async API handlers with error catching
export const withErrorHandling = (handler: Function) => {
  return async (..._args: any[]) => {
    try {
      return await handler(..._args);
    } catch (error) {
      logger.error('Unhandled API error:', error);
      
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return createServerErrorResponse(
        'An unexpected error occurred',
        message
      ) as NextResponse<ApiResponse<any>>;
    }
  };
} 