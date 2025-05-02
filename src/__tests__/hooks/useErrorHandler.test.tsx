/**
 * Test file for useErrorHandler hook
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ApiErrorCode } from '@/types/api';

describe('useErrorHandler', () => {
  // Helper function to render the hook and access result
  const renderErrorHandler = () => {
    const rendered = renderHook(() => useErrorHandler());
    return rendered;
  };

  it('should initialize with null error', () => {
    const { result } = renderErrorHandler();
    expect(result.current.error).toBeNull();
  });

  it('should set and clear error correctly', () => {
    const { result } = renderErrorHandler();
    
    // Set an error manually
    act(() => {
      result.current.setError({
        message: 'Test error',
        code: 'TEST_ERROR'
      });
    });
    
    // Check if error was set correctly
    expect(result.current.error).toEqual({
      message: 'Test error',
      code: 'TEST_ERROR'
    });
    
    // Clear the error
    act(() => {
      result.current.clearError();
    });
    
    // Check if error was cleared
    expect(result.current.error).toBeNull();
  });

  it('should handle pre-formatted API errors', () => {
    const { result } = renderErrorHandler();
    const testError = {
      message: 'API error occurred',
      code: 'API_ERROR',
      details: 'Details about the error',
      field: 'username'
    };
    
    act(() => {
      result.current.handleApiError(testError);
    });
    
    expect(result.current.error).toEqual(testError);
  });

  it('should handle non-standard errors and convert them', () => {
    const { result } = renderErrorHandler();
    const genericError = new Error('Generic error');
    
    act(() => {
      result.current.handleApiError(genericError);
    });
    
    // The implementation adds undefined fields, so we need to match that
    expect(result.current.error).toEqual({
      message: 'Generic error',
      code: undefined,
      details: undefined,
      field: undefined
    });
  });

  it('should provide a default message for unknown error codes', () => {
    const { result } = renderErrorHandler();
    
    // Test with a non-existent error code
    const defaultMessage = result.current.getUserFriendlyMessage('NON_EXISTENT_CODE');
    expect(defaultMessage).toBe('An error occurred');
  });

  it('should handle fetch response errors with json parsing', async () => {
    const { result } = renderErrorHandler();
    
    // Mock a fetch Response object
    const mockJsonPromise = Promise.resolve({
      error: 'API fetch error',
      code: 'FETCH_ERROR',
      details: 'Error details from fetch',
      field: 'password'
    });
    
    const mockResponse = {
      json: jest.fn().mockReturnValue(mockJsonPromise),
      statusText: 'Bad Request'
    };
    
    // We need to handle the async nature of the fetchResponse handling
    await act(async () => {
      // Call the handler
      result.current.handleApiError(mockResponse);
      
      // Wait for the promise to resolve
      await mockJsonPromise;
      
      // Wait for any state updates to process
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Now the state should be updated
    expect(result.current.error).toEqual({
      message: 'API fetch error',
      code: 'FETCH_ERROR',
      details: 'Error details from fetch',
      field: 'password'
    });
  });
}); 