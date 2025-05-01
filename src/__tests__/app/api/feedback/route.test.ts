/**
 * Tests for the feedback API route.
 * 
 * Note: Due to import hoisting in Jest, mock the modules first, then import the
 * real implementations that tests need to reference.
 */

// Define types for our mocks
type MockFn = jest.Mock & { mockReturnThis: () => MockFn; mockResolvedValue: (val: any) => MockFn };

// Set up mock implementations
const mockJsonFn = jest.fn().mockImplementation((body, options) => ({ body, options }));
const mockLogAuditFn = jest.fn().mockResolvedValue(undefined);
const mockGetUserFn = jest.fn().mockResolvedValue({
  data: { user: { id: 'test-user-id' } },
  error: null
});
const mockPromptSingleFn = jest.fn().mockResolvedValue({
  data: { id: 'prompt-id', user_id: 'test-user-id' },
  error: null
});
const mockFeedbackSingleFn = jest.fn().mockResolvedValue({
  data: { id: 'feedback-id' },
  error: null
});

// Mock modules
jest.mock('next/server', () => ({
  NextResponse: {
    json: mockJsonFn
  }
}));

jest.mock('@/services/audit', () => ({
  logAudit: mockLogAuditFn
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn()
}));

jest.mock('@/services/supabase/server', () => {
  const mockSelectFn = jest.fn().mockReturnThis();
  const mockEqFn = jest.fn().mockReturnThis();
  const mockInsertFn = jest.fn().mockImplementation(() => ({
    select: jest.fn().mockImplementation(() => ({
      single: mockFeedbackSingleFn
    }))
  }));
  
  return {
    createClient: jest.fn().mockImplementation(() => ({
      from: jest.fn().mockImplementation(() => ({
        select: mockSelectFn,
        eq: mockEqFn,
        single: mockPromptSingleFn,
        insert: mockInsertFn
      })),
      auth: {
        getUser: mockGetUserFn
      }
    }))
  };
});

// Reference to the POST handler function
let postHandler: any;

// Import the module in a way that doesn't redeclare variables
beforeAll(() => {
  // Dynamic import to avoid variable redeclaration
  postHandler = require('@/app/api/feedback/route').POST;
});

describe('Feedback API Route Handler', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the mocks to their default success state
    mockGetUserFn.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
    
    mockPromptSingleFn.mockResolvedValue({
      data: { id: 'prompt-id', user_id: 'test-user-id' },
      error: null
    });
  });
  
  it('should return 401 when user is not authenticated', async () => {
    // Setup auth failure
    mockGetUserFn.mockResolvedValue({
      data: { user: null },
      error: { message: 'User not authenticated' }
    });
    
    const request = new Request('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt_id: '123e4567-e89b-12d3-a456-426614174000',
        suggestion_id: 'abc123',
        relevance_score: 4
      })
    });
    
    await postHandler(request);
    
    expect(mockJsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Authentication required',
        code: 'AUTHENTICATION_ERROR'
      }),
      { status: 401 }
    );
  });
  
  it('should return 400 for invalid JSON in request body', async () => {
    const request = new Request('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json'
    });
    
    await postHandler(request);
    
    // The error will be caught in the main try-catch block
    expect(mockJsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'An error occurred while saving feedback',
        code: 'UNEXPECTED_ERROR'
      }),
      { status: 500 }
    );
  });
  
  it('should return 400 for invalid feedback format', async () => {
    const request = new Request('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing prompt_id
        suggestion_id: 'abc123',
        relevance_score: 4
      })
    });
    
    await postHandler(request);
    
    expect(mockJsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Required',
        field: 'prompt_id',
        code: 'VALIDATION_ERROR'
      }),
      { status: 400 }
    );
  });
  
  it('should return 404 if prompt is not found', async () => {
    // Setup prompt not found
    mockPromptSingleFn.mockResolvedValue({
      data: null,
      error: { message: 'Prompt not found' }
    });
    
    const request = new Request('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt_id: '123e4567-e89b-12d3-a456-426614174000',
        suggestion_id: 'abc123',
        relevance_score: 4
      })
    });
    
    await postHandler(request);
    
    expect(mockJsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Prompt not found',
        code: 'RESOURCE_ERROR'
      }),
      { status: 404 }
    );
  });
  
  it('should return 403 if user does not own the prompt', async () => {
    // Setup prompt owned by different user
    mockPromptSingleFn.mockResolvedValue({
      data: { id: 'prompt-id', user_id: 'different-user-id' },
      error: null
    });
    
    const request = new Request('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt_id: '123e4567-e89b-12d3-a456-426614174000',
        suggestion_id: 'abc123',
        relevance_score: 4
      })
    });
    
    await postHandler(request);
    
    expect(mockJsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unauthorized access to this prompt',
        code: 'AUTHORIZATION_ERROR'
      }),
      { status: 403 }
    );
  });
  
  it('should successfully submit feedback and log audit', async () => {
    const request = new Request('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt_id: '123e4567-e89b-12d3-a456-426614174000',
        suggestion_id: 'abc123',
        relevance_score: 4,
        comment: 'This was helpful'
      })
    });
    
    const response = await postHandler(request);
    const responseBody = response.body;
    
    expect(responseBody).toEqual({
      success: true,
      data: {
        id: expect.any(String),
        prompt_id: '123e4567-e89b-12d3-a456-426614174000',
        suggestion_id: 'abc123',
        relevance_score: 4
      }
    });
    
    // Direct check of logAudit call
    expect(mockLogAuditFn).toHaveBeenCalledWith(
      'feedback',
      'feedback',
      expect.any(String),
      expect.objectContaining({
        prompt_id: '123e4567-e89b-12d3-a456-426614174000',
        suggestion_id: 'abc123',
        score: 4
      })
    );
  });
}); 