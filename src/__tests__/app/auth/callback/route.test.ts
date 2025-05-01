/**
 * Tests for the auth callback route.
 * 
 * Note: Due to import hoisting in Jest, mock the modules first, then import the
 * real implementations that tests need to reference.
 */

// Mock the modules with inline mock functions
jest.mock('next/server', () => {
  const mockRedirect = jest.fn().mockImplementation((url) => ({ url }));
  return {
    NextResponse: {
      redirect: mockRedirect
    }
  };
});

jest.mock('next/headers', () => ({
  cookies: jest.fn()
}));

// Define variables for mock functions for use in tests
let mockRedirect: jest.Mock;
let mockFrom: jest.Mock;
let mockSelect: jest.Mock;
let mockEq: jest.Mock;
let mockSingle: jest.Mock;
let mockExchangeCodeForSession: jest.Mock;

// Mock supabase server
jest.mock('@/services/supabase/server', () => {
  // Create mock implementations inline
  mockSelect = jest.fn().mockReturnThis();
  mockEq = jest.fn().mockReturnThis();
  mockSingle = jest.fn().mockResolvedValue({
    data: { onboarding_completed: true },
    error: null
  });
  
  mockFrom = jest.fn().mockReturnValue({
    select: mockSelect,
    eq: mockEq,
    single: mockSingle
  });
  
  mockExchangeCodeForSession = jest.fn().mockResolvedValue({
    data: { 
      session: { 
        user: { id: 'test-user-id' } 
      } 
    },
    error: null
  });
  
  return {
    createClient: jest.fn().mockReturnValue({
      from: mockFrom,
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession
      }
    })
  };
});

// Extract the NextResponse mock functions after modules are mocked
beforeAll(() => {
  mockRedirect = require('next/server').NextResponse.redirect;
});

// Import the API route to test after all mocks are set up
let authHandler: any;

// Import the module in a way that doesn't redeclare variables
beforeAll(() => {
  authHandler = require('@/app/auth/callback/route').GET;
});

describe('Auth Callback Route Handler', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful authentication by default
    mockExchangeCodeForSession.mockResolvedValue({
      data: { 
        session: { 
          user: { id: 'test-user-id' } 
        } 
      },
      error: null
    });
    
    // Mock complete onboarding by default
    mockSingle.mockResolvedValue({
      data: { onboarding_completed: true },
      error: null
    });
  });
  
  it('should redirect to original URL when authentication is successful and onboarding is complete', async () => {
    const request = new Request('http://example.com/auth/callback?code=test-auth-code&redirectUrl=/dashboard');
    
    await authHandler(request);
    
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('test-auth-code');
    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockEq).toHaveBeenCalledWith('id', 'test-user-id');
    
    expect(mockRedirect).toHaveBeenCalledWith('http://example.com/dashboard');
  });
  
  it('should redirect to home page when no redirectUrl is provided', async () => {
    const request = new Request('http://example.com/auth/callback?code=test-auth-code');
    
    await authHandler(request);
    
    expect(mockRedirect).toHaveBeenCalledWith('http://example.com/');
  });
  
  it('should redirect to onboarding when user has not completed onboarding', async () => {
    // Mock incomplete onboarding
    mockSingle.mockResolvedValue({
      data: { onboarding_completed: false },
      error: null
    });
    
    const request = new Request('http://example.com/auth/callback?code=test-auth-code&redirectUrl=/dashboard');
    
    await authHandler(request);
    
    expect(mockRedirect).toHaveBeenCalledWith('http://example.com/onboarding');
  });
  
  it('should redirect to onboarding when user profile does not exist', async () => {
    // Mock no profile found
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Profile not found' }
    });
    
    const request = new Request('http://example.com/auth/callback?code=test-auth-code');
    
    await authHandler(request);
    
    expect(mockRedirect).toHaveBeenCalledWith('http://example.com/onboarding');
  });
  
  it('should redirect to login with error when code exchange fails', async () => {
    // Mock authentication failure
    mockExchangeCodeForSession.mockResolvedValue({
      data: {},
      error: { message: 'Invalid code' }
    });
    
    const request = new Request('http://example.com/auth/callback?code=invalid-code');
    
    await authHandler(request);
    
    expect(mockRedirect).toHaveBeenCalledWith('http://example.com/auth/login?error=session_exchange_failed');
  });
  
  it('should redirect to login when no code is provided', async () => {
    const request = new Request('http://example.com/auth/callback');
    
    await authHandler(request);
    
    expect(mockRedirect).toHaveBeenCalledWith('http://example.com/auth/login?error=no_code_provided');
  });
}); 