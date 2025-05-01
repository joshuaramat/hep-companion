/**
 * Tests for the organizations API route.
 * 
 * Note: Due to import hoisting in Jest, mock the modules first, then import the
 * real implementations that tests need to reference.
 */

// Mock NextResponse
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: jest.fn().mockImplementation((body, options) => ({ body, options }))
    }
  };
});

// Mock next/headers before supabase client
jest.mock('next/headers', () => ({
  cookies: jest.fn()
}));

// Mock audit service
jest.mock('@/services/audit', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined)
}));

// Since we don't need to test all functionality, simplify test cases
describe('Organizations API Route POST', () => {
  // Mock function variables
  let mockJson: jest.Mock;
  let mockLogAudit: jest.Mock;
  let mockClientFrom: jest.Mock;
  let mockGetUser: jest.Mock;
  let orgPostHandler: any;
  
  beforeAll(() => {
    // Set up first so that import gets correct mock
    jest.mock('@/services/supabase/server', () => {
      // Create internal mockClient for unit testing
      const mockClientObj = {
        from: jest.fn(),
        auth: {
          getUser: jest.fn()
        }
      };
      return {
        createClient: jest.fn().mockReturnValue(mockClientObj)
      };
    });
    
    // Now import handlers after mocks are set up
    orgPostHandler = require('@/app/api/organizations/route').POST;
    mockJson = require('next/server').NextResponse.json;
    mockLogAudit = require('@/services/audit').logAudit;
    
    // Get references to client functions
    const mockClient = require('@/services/supabase/server').createClient();
    mockClientFrom = mockClient.from;
    mockGetUser = mockClient.auth.getUser;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should return 401 when user is not authenticated', async () => {
    // Mock authentication failure
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User not authenticated' }
    });
    
    const request = new Request('http://localhost/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Clinic', clinic_id: 'NEW-123' })
    });
    
    await orgPostHandler(request);
    
    // Verify auth check was made
    expect(mockGetUser).toHaveBeenCalled();
    
    // Verify correct error response
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Authentication required',
        code: 'AUTHENTICATION_ERROR'
      }),
      { status: 401 }
    );
  });
  
  it('should handle validation errors for invalid JSON', async () => {
    // Mock successful authentication
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
    
    const request = new Request('http://localhost/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json'
    });
    
    await orgPostHandler(request);
    
    // Should never reach the database calls
    expect(mockClientFrom).not.toHaveBeenCalled();
    
    // Should return an error response
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(String),
        code: 'UNEXPECTED_ERROR'
      }),
      { status: 500 }
    );
  });
  
  it('should validate organization data', async () => {
    // Mock successful authentication
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
    
    // Create a request with empty organization name
    const request = new Request('http://localhost/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }) // Empty name should fail validation
    });
    
    await orgPostHandler(request);
    
    // Should return validation error
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'VALIDATION_ERROR'
      }),
      { status: 400 }
    );
  });
}); 