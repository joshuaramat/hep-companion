/**
 * SessionProvider component tests
 */

// Import test utilities first
import React from 'react';
import { render, waitFor, act, RenderResult } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create mock implementations
const mockPush = jest.fn();
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockUnsubscribe = jest.fn();

// Manually mock modules to avoid circular references
jest.mock('next/navigation', () => {
  return {
    useRouter: () => ({ push: mockPush })
  };
});

jest.mock('@/hooks/useIdleTimeout', () => {
  return {
    useIdleTimeout: () => ({ isIdle: false })
  };
});

jest.mock('@/services/supabase/client', () => {
  return {
    createClient: () => ({
      auth: {
        getSession: mockGetSession,
        onAuthStateChange: mockOnAuthStateChange
      }
    })
  };
});

// Import the component after mock setup
import SessionProvider from '@/components/auth/SessionProvider';

describe('SessionProvider Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock return values
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } }
    });
    
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe
        }
      }
    });
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/dashboard'
      },
      writable: true
    });
  });
  
  it('should render children when a valid session exists', async () => {
    // Setup a valid session
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } }
    });
    
    let rendered: RenderResult;
    await act(async () => {
      rendered = render(
        <SessionProvider>
          <div data-testid="test-child">Test Child</div>
        </SessionProvider>
      );
    });
    
    // Wait for session check to complete
    await waitFor(() => {
      expect(rendered.getByTestId('test-child')).toBeInTheDocument();
    });
    
    // Should not redirect
    expect(mockPush).not.toHaveBeenCalled();
  });
  
  it('should redirect to login when no session exists', async () => {
    // Setup no session
    mockGetSession.mockResolvedValue({
      data: { session: null }
    });
    
    await act(async () => {
      render(
        <SessionProvider>
          <div data-testid="test-child">Test Child</div>
        </SessionProvider>
      );
    });
    
    // Should redirect to login
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });
  
  it('should not redirect to login when no session exists but already on login page', async () => {
    // Setup no session
    mockGetSession.mockResolvedValue({
      data: { session: null }
    });
    
    // Mock being on login page
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/auth/login'
      },
      writable: true
    });
    
    await act(async () => {
      render(
        <SessionProvider>
          <div data-testid="test-child">Test Child</div>
        </SessionProvider>
      );
    });
    
    // Should not redirect to login
    expect(mockPush).not.toHaveBeenCalled();
  });
  
  it('should redirect to login when signed out', async () => {
    // Setup a valid session initially
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } }
    });
    
    // Mock auth state change to trigger sign out
    let authChangeCallback: (event: string) => void;
    mockOnAuthStateChange.mockImplementation((callback) => {
      authChangeCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe
          }
        }
      };
    });
    
    await act(async () => {
      render(
        <SessionProvider>
          <div data-testid="test-child">Test Child</div>
        </SessionProvider>
      );
    });
    
    // Wait for initial render
    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });
    
    // Trigger auth state change to SIGNED_OUT
    await act(async () => {
      authChangeCallback('SIGNED_OUT');
    });
    
    // Should redirect to login
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });
  
  it('should unsubscribe from auth changes on unmount', async () => {
    // Set up the mock onAuthStateChange to store the callback and return the subscription
    mockOnAuthStateChange.mockImplementation(() => {
      return {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe
          }
        }
      };
    });
    
    let rendered: RenderResult;
    await act(async () => {
      rendered = render(
        <SessionProvider>
          <div>Test Child</div>
        </SessionProvider>
      );
    });
    
    // Wait for the component to fully mount and subscribe
    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });
    
    // Unmount component
    await act(async () => {
      rendered.unmount();
    });
    
    // Should unsubscribe
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
}); 