/**
 * Tests for the organizations search API route.
 * 
 * Note: Due to import hoisting in Jest, mock the modules first, then import the
 * real implementations that tests need to reference.
 */

// Mock the modules with inline mock functions
jest.mock('next/server', () => {
  const mockJson = jest.fn().mockImplementation((body, options) => ({ body, options }));
  return {
    NextResponse: {
      json: mockJson
    }
  };
});

jest.mock('next/headers', () => ({
  cookies: jest.fn()
}));

// We will extract these mock functions for use in tests
let mockJson: jest.Mock;
let mockSearchGetUser: jest.Mock;
let mockRpc: jest.Mock;

// Mock Supabase service
jest.mock('@/services/supabase/server', () => {
  // Create mock implementations inline
  mockRpc = jest.fn().mockResolvedValue({
    data: [
      { id: 'org-1', name: 'Test Clinic', clinic_id: 'CLINIC-1' },
      { id: 'org-2', name: 'Test Hospital', clinic_id: 'CLINIC-2' }
    ],
    error: null
  });
  
  mockSearchGetUser = jest.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id' } },
    error: null
  });
  
  return {
    createClient: jest.fn().mockReturnValue({
      rpc: mockRpc,
      auth: {
        getUser: mockSearchGetUser
      }
    })
  };
});

// Extract the NextResponse.json mock after modules are mocked
beforeAll(() => {
  mockJson = require('next/server').NextResponse.json;
});

// Import the API route to test after all mocks are set up
let searchHandler: any;

// Import the module in a way that doesn't redeclare variables
beforeAll(() => {
  searchHandler = require('@/app/api/organizations/search/route').GET;
});

describe('Organizations Search API Route Handler', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks to their default success state
    mockSearchGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
    
    // Default success for organization search
    mockRpc.mockResolvedValue({
      data: [
        { id: 'org-1', name: 'Test Clinic', clinic_id: 'CLINIC-1' },
        { id: 'org-2', name: 'Test Hospital', clinic_id: 'CLINIC-2' }
      ],
      error: null
    });
  });
  
  it('should return 401 when user is not authenticated', async () => {
    mockSearchGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User not authenticated' }
    });
    
    const request = new Request('http://localhost/api/organizations/search?query=test');
    
    await searchHandler(request);
    
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_ERROR'
      }),
      { status: 401 }
    );
  });
  
  it('should return 400 for missing search query', async () => {
    const request = new Request('http://localhost/api/organizations/search');
    
    await searchHandler(request);
    
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: 'Invalid search query',
        code: 'VALIDATION_ERROR',
        error: 'Validation failed for field: query',
        data: expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('Expected string'),
            path: ['query']
          })
        ])
      }),
      { status: 400 }
    );
  });
  
  it('should return 400 for empty search query', async () => {
    const request = new Request('http://localhost/api/organizations/search?query=');
    
    await searchHandler(request);
    
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: 'Invalid search query',
        code: 'VALIDATION_ERROR',
        error: 'Validation failed for field: query',
        data: expect.arrayContaining([
          expect.objectContaining({
            message: 'Search query is required',
            path: ['query']
          })
        ])
      }),
      { status: 400 }
    );
  });
  
  it('should return 500 if search function fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Database error' }
    });
    
    const request = new Request('http://localhost/api/organizations/search?query=test');
    
    await searchHandler(request);
    
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: 'Failed to search organizations',
        code: 'DATABASE_ERROR',
        error: 'Database error'
      }),
      { status: 500 }
    );
  });
  
  it('should successfully search organizations and return results', async () => {
    const request = new Request('http://localhost/api/organizations/search?query=test%20clinic');
    
    const response = await searchHandler(request);
    const responseBody = response.body;
    
    // Should call RPC function with correct parameters
    expect(mockRpc).toHaveBeenCalledWith(
      'search_organizations', 
      { search_term: 'test clinic' }
    );
    
    // Should return success with search results
    expect(responseBody).toEqual({
      ok: true,
      message: 'Found 2 organization(s) matching "test clinic"',
      data: [
        { id: 'org-1', name: 'Test Clinic', clinic_id: 'CLINIC-1' },
        { id: 'org-2', name: 'Test Hospital', clinic_id: 'CLINIC-2' }
      ]
    });
  });
  
  it('should return empty array when no results found', async () => {
    mockRpc.mockResolvedValue({
      data: [],
      error: null
    });
    
    const request = new Request('http://localhost/api/organizations/search?query=nonexistent');
    
    const response = await searchHandler(request);
    const responseBody = response.body;
    
    // Should return success with empty array
    expect(responseBody).toEqual({
      ok: true,
      message: 'Found 0 organization(s) matching "nonexistent"',
      data: []
    });
  });
}); 