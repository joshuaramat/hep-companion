/**
 * Test file for useIdleTimeout hook
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';

// Create mocks before importing the hook
const mockPush = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue({ error: null });

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock supabase client
jest.mock('@/services/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut
    }
  })
}));

// Import the hook after mocks are set up
import { useIdleTimeout } from '@/hooks/useIdleTimeout';

describe('useIdleTimeout', () => {
  beforeEach(() => {
    // Setup fake timers
    jest.useFakeTimers();
    
    // Mock window event listeners
    jest.spyOn(window, 'addEventListener').mockImplementation(() => {});
    jest.spyOn(window, 'removeEventListener').mockImplementation(() => {});
    
    // Clear all mocks for a fresh start
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Clean up
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  
  it('should initialize with idle state as false', () => {
    const { result } = renderHook(() => useIdleTimeout());
    expect(result.current.isIdle).toBe(false);
  });
  
  it('should set up timer with default timeout (15 minutes)', () => {
    // Spy on setTimeout
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    
    renderHook(() => useIdleTimeout());
    
    // Verify that setTimeout was called with the correct timeout value
    expect(setTimeoutSpy).toHaveBeenCalled();
    // Get the first call's arguments
    const timeoutArgs = setTimeoutSpy.mock.calls[0];
    // Check that the timeout value is 15 minutes in milliseconds
    expect(timeoutArgs[1]).toBe(15 * 60 * 1000);
  });
  
  it('should set up timer with custom timeout', () => {
    // Spy on setTimeout
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    
    // Use a custom timeout of 5 minutes
    renderHook(() => useIdleTimeout(5));
    
    // Verify that setTimeout was called with the correct timeout value
    expect(setTimeoutSpy).toHaveBeenCalled();
    // Get the first call's arguments
    const timeoutArgs = setTimeoutSpy.mock.calls[0];
    // Check that the timeout value is 5 minutes in milliseconds
    expect(timeoutArgs[1]).toBe(5 * 60 * 1000);
  });
  
  it('should clean up timers and event listeners on unmount', () => {
    // Spy on clearTimeout
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    // Render and unmount the hook
    const { unmount } = renderHook(() => useIdleTimeout());
    unmount();
    
    // Verify cleanup
    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(window.removeEventListener).toHaveBeenCalled();
  });
  
  it('should reset timer when user activity is detected', () => {
    // Spy on clearTimeout and setTimeout
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    
    // Render the hook
    renderHook(() => useIdleTimeout());
    
    // Get the event handler function from addEventListener mock
    const eventListenerCalls = (window.addEventListener as jest.Mock).mock.calls;
    const eventName = eventListenerCalls[0][0]; // First event name
    const eventHandler = eventListenerCalls[0][1]; // First handler function
    
    // Clear mocks to reset call counts
    clearTimeoutSpy.mockClear();
    setTimeoutSpy.mockClear();
    
    // Simulate user activity by calling the event handler
    eventHandler();
    
    // Verify that the timer was reset
    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(setTimeoutSpy).toHaveBeenCalled();
  });
}); 