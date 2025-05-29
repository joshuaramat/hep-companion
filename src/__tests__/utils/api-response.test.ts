/**
 * @jest-environment node
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createAuthErrorResponse,
  createAuthzErrorResponse,
  createNotFoundResponse,
  createRateLimitResponse,
  createServerErrorResponse,
  withErrorHandling,
  ApiResponse
} from '@/utils/api-response';
import { NextResponse } from 'next/server';

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  }
}));

// Mock NextResponse for testing
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      data,
      json: () => Promise.resolve(data)
    }))
  }
}));

describe('API Response Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSuccessResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: '123', name: 'Test' };
      const response = createSuccessResponse(data, 'Success message');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: true,
          message: 'Success message',
          data
        },
        { status: 200 }
      );
      expect(response.status).toBe(200);
    });

    it('should create a success response with custom status', () => {
      const data = { id: '123' };
      const response = createSuccessResponse(data, 'Created', 201);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: true,
          message: 'Created',
          data
        },
        { status: 201 }
      );
      expect(response.status).toBe(201);
    });

    it('should create a success response with default message', () => {
      const data = { id: '123' };
      const response = createSuccessResponse(data);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: true,
          message: 'Operation successful',
          data
        },
        { status: 200 }
      );
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response with message and status', () => {
      const response = createErrorResponse('Something went wrong', 400);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'Something went wrong'
        },
        { status: 400 }
      );
      expect(response.status).toBe(400);
    });

    it('should create an error response with code and error details', () => {
      const response = createErrorResponse('Validation failed', 400, 'VALIDATION_ERROR', 'Field is required');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          error: 'Field is required'
        },
        { status: 400 }
      );
      expect(response.status).toBe(400);
    });

    it('should use default status 500 when not provided', () => {
      const response = createErrorResponse('Error occurred');
      
      expect(response.status).toBe(500);
    });
  });

  describe('createValidationErrorResponse', () => {
    it('should create a validation error response', () => {
      const response = createValidationErrorResponse('Field is required', 'email');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'Field is required',
          code: 'VALIDATION_ERROR',
          error: 'Validation failed for field: email'
        },
        { status: 400 }
      );
      expect(response.status).toBe(400);
    });

    it('should create a validation error response with details', () => {
      const details = [{ path: ['email'], message: 'Invalid email' }];
      const response = createValidationErrorResponse('Validation failed', 'email', details);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          error: 'Validation failed for field: email',
          data: details
        },
        { status: 400 }
      );
      expect(response.status).toBe(400);
    });

    it('should create a validation error response without field', () => {
      const response = createValidationErrorResponse('Invalid data format');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'Invalid data format',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
      expect(response.status).toBe(400);
    });
  });

  describe('createAuthErrorResponse', () => {
    it('should create an authentication error response with default message', () => {
      const response = createAuthErrorResponse();
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_ERROR'
        },
        { status: 401 }
      );
      expect(response.status).toBe(401);
    });

    it('should create an authentication error response with custom message', () => {
      const response = createAuthErrorResponse('Token expired');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'Token expired',
          code: 'AUTHENTICATION_ERROR'
        },
        { status: 401 }
      );
      expect(response.status).toBe(401);
    });
  });

  describe('createAuthzErrorResponse', () => {
    it('should create an authorization error response with default message', () => {
      const response = createAuthzErrorResponse();
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'Insufficient permissions',
          code: 'AUTHORIZATION_ERROR'
        },
        { status: 403 }
      );
      expect(response.status).toBe(403);
    });

    it('should create an authorization error response with custom message', () => {
      const response = createAuthzErrorResponse('Access denied');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'Access denied',
          code: 'AUTHORIZATION_ERROR'
        },
        { status: 403 }
      );
      expect(response.status).toBe(403);
    });
  });

  describe('createNotFoundResponse', () => {
    it('should create a not found error response with default resource', () => {
      const response = createNotFoundResponse();
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'Resource not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
      expect(response.status).toBe(404);
    });

    it('should create a not found error response with custom resource', () => {
      const response = createNotFoundResponse('User');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'User not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
      expect(response.status).toBe(404);
    });
  });

  describe('createRateLimitResponse', () => {
    it('should create a rate limit error response with default message', () => {
      const response = createRateLimitResponse();
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
      expect(response.status).toBe(429);
    });

    it('should create a rate limit error response with custom message', () => {
      const response = createRateLimitResponse('Too many requests');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
      expect(response.status).toBe(429);
    });
  });

  describe('createServerErrorResponse', () => {
    it('should create a server error response with default message', () => {
      const response = createServerErrorResponse();
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR'
        },
        { status: 500 }
      );
      expect(response.status).toBe(500);
    });

    it('should create a server error response with custom message and error', () => {
      const response = createServerErrorResponse('Database connection failed', 'Connection timeout');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'Database connection failed',
          code: 'INTERNAL_SERVER_ERROR',
          error: 'Connection timeout'
        },
        { status: 500 }
      );
      expect(response.status).toBe(500);
    });
  });

  describe('withErrorHandling', () => {
    it('should wrap handler and return result on success', async () => {
      const mockResponse = { status: 200, data: { id: '123' } };
      const mockHandler = jest.fn().mockResolvedValue(mockResponse);
      
      const wrappedHandler = withErrorHandling(mockHandler);
      const result = await wrappedHandler('arg1', 'arg2');
      
      expect(mockHandler).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe(mockResponse);
    });

    it('should catch errors and return server error response', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Handler failed'));
      
      const wrappedHandler = withErrorHandling(mockHandler);
      const result = await wrappedHandler('arg1');
      
      expect(mockHandler).toHaveBeenCalledWith('arg1');
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'An unexpected error occurred',
          code: 'INTERNAL_SERVER_ERROR',
          error: 'Handler failed'
        },
        { status: 500 }
      );
      expect(result.status).toBe(500);
    });

    it('should handle non-Error objects thrown', async () => {
      const mockHandler = jest.fn().mockRejectedValue('String error');
      
      const wrappedHandler = withErrorHandling(mockHandler);
      const result = await wrappedHandler();
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          ok: false,
          message: 'An unexpected error occurred',
          code: 'INTERNAL_SERVER_ERROR',
          error: 'Unknown error occurred'
        },
        { status: 500 }
      );
      expect(result.status).toBe(500);
    });
  });

  describe('Response format consistency', () => {
    it('should ensure all responses follow ApiResponse interface', async () => {
      const responses = [
        createSuccessResponse({ test: true }),
        createErrorResponse('Error'),
        createValidationErrorResponse('Validation error'),
        createAuthErrorResponse(),
        createAuthzErrorResponse(),
        createNotFoundResponse(),
        createRateLimitResponse(),
        createServerErrorResponse()
      ];

      // Verify all responses have the expected structure
      responses.forEach(response => {
        expect(response.status).toBeDefined();
        expect(typeof response.status).toBe('number');
      });
    });

    it('should include required ApiResponse fields', async () => {
      const successResponse = createSuccessResponse({ id: '123' }, 'Success');
      const errorResponse = createErrorResponse('Error', 400, 'ERROR_CODE');

      // Verify responses have expected status codes
      expect(successResponse.status).toBe(200);
      expect(errorResponse.status).toBe(400);
    });
  });
}); 