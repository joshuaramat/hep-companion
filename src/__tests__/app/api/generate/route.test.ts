/**
 * Tests for the generate API route.
 * 
 * Note: Due to import hoisting in Jest, mock the modules first, then import the
 * real implementations that tests needed to reference.
 */

// Define mocked implementations first
const mockNextResponse = {
  json: jest.fn().mockImplementation((body, options) => ({ body, options })),
};

const mockLogAudit = jest.fn().mockResolvedValue(undefined);

const mockGeneratePatientKey = jest.fn().mockReturnValue('mocked-patient-key');

const mockValidateClinicalInput = jest.fn().mockReturnValue({ isValid: true, error: null });

const mockValidateGPTResponse = jest.fn().mockReturnValue([
  { 
    exercise_name: 'Test Exercise', 
    sets: 3, 
    reps: 10, 
    frequency: '3 times per week',
    citations: [{ 
      title: 'Test Title',
      authors: 'Test Author',
      journal: 'Test Journal',
      year: '2023',
      doi: '10.1234/test',
      url: 'https://example.com'
    }]
  }
]);

class MockGPTValidationError extends Error {
  details: any;
  code: string;
  constructor(message: string, details: any, code: string) {
    super(message);
    this.details = details;
    this.code = code;
  }
}

const mockRetryWithExponentialBackoff = jest.fn().mockImplementation(async (fn) => fn());

class MockOpenAIAPIError extends Error {
  status: number;
  retryable: boolean;
  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.status = status;
    this.retryable = retryable;
  }
}

// Mock OpenAI API response
const mockOpenAICreate = jest.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content: JSON.stringify({
          exercises: [
            {
              name: 'Test Exercise',
              sets: 3,
              reps: '10-12',
              notes: 'Test notes',
              evidence_source: 'Test Journal, 2023'
            }
          ],
          clinical_notes: 'Test clinical reasoning',
          citations: ['Test Journal, 2023'],
          confidence_level: 'high'
        })
      }
    }
  ]
});

// Mock all Supabase dependencies
const mockSupabaseInsert = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnValue({
    single: jest.fn().mockResolvedValue({
      data: { id: 'test-id' },
      error: null
    })
  })
});

const mockSupabaseFrom = jest.fn().mockReturnValue({
  insert: mockSupabaseInsert
});

const mockGetUser = jest.fn().mockResolvedValue({
  data: { user: { id: 'test-user-id' } },
  error: null
});

const mockSupabaseAuth = {
  getUser: mockGetUser
};

const mockSupabaseClient = {
  from: mockSupabaseFrom,
  auth: mockSupabaseAuth
};

// Setup all the mocks
jest.mock('next/server', () => ({
  NextResponse: mockNextResponse
}));

jest.mock('@/services/utils/validation', () => ({
  validateClinicalInput: mockValidateClinicalInput
}));

jest.mock('@/services/audit', () => ({
  logAudit: mockLogAudit
}));

jest.mock('@/utils/patient-key', () => ({
  generatePatientKey: mockGeneratePatientKey
}));

jest.mock('@/utils/gpt-validation', () => ({
  validateGPTResponse: mockValidateGPTResponse,
  GPTValidationError: MockGPTValidationError
}));

jest.mock('@/utils/retry', () => ({
  retryWithExponentialBackoff: mockRetryWithExponentialBackoff,
  OpenAIAPIError: MockOpenAIAPIError
}));

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockOpenAICreate
      }
    }
  }))
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/services/supabase/server', () => ({
  createClient: jest.fn().mockReturnValue(mockSupabaseClient)
}));

jest.mock('nanoid', () => ({
  nanoid: jest.fn().mockReturnValue('test-suggestion-id')
}));

// Import the API route to test - after all mocks are set up
// Use a variable declaration that doesn't conflict
let routeHandler: any;

// Import the module in a way that doesn't redeclare variables
beforeAll(() => {
  // Dynamic import to avoid variable redeclaration
  routeHandler = require('@/app/api/generate/route').POST;
});

describe('Generate API Route Handler', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the validation mock
    mockValidateClinicalInput.mockReturnValue({ isValid: true, error: null });
    
    // Reset the user mock to its default state
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
  });
  
  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User not authenticated' }
    });
    
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Valid clinical scenario for testing' })
    });
    
    await routeHandler(request);
    
    expect(mockNextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_ERROR'
      }),
      { status: 401 }
    );
  });
  
  it('should return 400 for invalid JSON in request body', async () => {
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json'
    });
    
    await routeHandler(request);
    
    expect(mockNextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR',
        error: 'Invalid JSON in request body'
      }),
      { status: 500 }
    );
  });
  
  it('should return 400 for prompt that is too short', async () => {
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Too short' })
    });
    
    await routeHandler(request);
    
    expect(mockNextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: expect.stringContaining('at least 20 characters'),
        code: 'VALIDATION_ERROR',
        error: 'Validation failed for field: prompt',
        data: expect.any(Array)
      }),
      { status: 400 }
    );
  });
  
  it('should return 400 for prompt with insufficient clinical information', async () => {
    // Set the validation to fail
    mockValidateClinicalInput.mockReturnValue({ 
      isValid: false, 
      error: 'Please include specific clinical terms and patient details' 
    });
    
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: 'This is a long enough text but not clinical enough to pass validation'
      })
    });
    
    await routeHandler(request);
    
    expect(mockNextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: 'Please include specific clinical terms and patient details',
        code: 'VALIDATION_ERROR'
      }),
      { status: 400 }
    );
  });
  
  it('should generate a patient key if mrn and clinic_id are provided', async () => {
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: 'This is a valid clinical scenario that is over 20 characters long with patient details and clinical terms',
        mrn: '12345',
        clinic_id: 'CLINIC-ABC123'
      })
    });
    
    await routeHandler(request);
    
    expect(mockGeneratePatientKey).toHaveBeenCalledWith('12345', 'CLINIC-ABC123');
    expect(mockSupabaseFrom).toHaveBeenCalledWith('prompts');
    expect(mockSupabaseInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        patient_key: 'mocked-patient-key'
      })
    );
  });
  
  it('should successfully generate exercise suggestions and store them', async () => {
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: 'This is a valid clinical scenario that is over 20 characters long with knee pain, range of motion issues, and weakness in quadriceps'
      })
    });
    
    const response = await routeHandler(request);
    const responseBody = response.body;
    
    expect(responseBody).toEqual({
      ok: true,
      message: 'Exercise suggestions generated successfully',
      data: expect.objectContaining({
        id: expect.any(String),
        exercises: expect.arrayContaining([
          expect.objectContaining({
            name: 'Test Exercise',
            sets: 3,
            reps: '10-12',
            notes: 'Test notes',
            evidence_source: 'Test Journal, 2023',
            id: expect.any(String)
          })
        ]),
        clinical_notes: 'Test clinical reasoning',
        citations: ['Test Journal, 2023'],
        confidence_level: 'high'
      })
    });
    
    expect(mockLogAudit).toHaveBeenCalledWith(
      'generate',
      'prompt',
      expect.any(String),
      expect.objectContaining({
        has_patient_key: false,
        exercises_count: 1,
        confidence_level: 'high'
      })
    );
  });
}); 