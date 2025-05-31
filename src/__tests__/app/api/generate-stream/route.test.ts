/**
 * Tests for the generate-stream SSE API route.
 */

// Mock implementations must be defined before imports
const mockLogAudit = jest.fn().mockResolvedValue(undefined);
const mockGeneratePatientKey = jest.fn().mockReturnValue('mocked-patient-key');
const mockValidateClinicalInput = jest.fn().mockReturnValue({ isValid: true, error: null });
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock OpenAI response
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

// Mock Supabase
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

const mockSupabaseRpc = jest.fn().mockResolvedValue({
  data: [
    { stage: 'fetching-exercises', avg_duration_ms: 300 },
    { stage: 'generating', avg_duration_ms: 2000 },
    { stage: 'validating', avg_duration_ms: 100 },
    { stage: 'storing', avg_duration_ms: 200 }
  ],
  error: null
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
  auth: mockSupabaseAuth,
  rpc: mockSupabaseRpc
};

// Mock modules
jest.mock('@/services/audit', () => ({
  logAudit: mockLogAudit
}));

jest.mock('@/utils/patient-key', () => ({
  generatePatientKey: mockGeneratePatientKey
}));

jest.mock('@/services/utils/validation', () => ({
  validateClinicalInput: mockValidateClinicalInput
}));

jest.mock('@/utils/logger', () => ({
  logger: mockLogger
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

jest.mock('@/services/supabase/server', () => ({
  createClient: jest.fn().mockReturnValue(mockSupabaseClient)
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockReturnValue({})
}));

jest.mock('@/services/supabase/exercises', () => ({
  getExercises: jest.fn().mockResolvedValue([
    {
      name: 'Test Exercise',
      condition: 'LBP',
      description: 'Test description',
      journal: 'Test Journal',
      year: 2023,
      doi: '10.1234/test'
    }
  ])
}));

jest.mock('@/utils/retry', () => ({
  retryWithExponentialBackoff: jest.fn(async (fn) => fn()),
  OpenAIAPIError: class extends Error {
    status: number;
    retryable: boolean;
    constructor(message: string, status: number, retryable: boolean) {
      super(message);
      this.status = status;
      this.retryable = retryable;
    }
  }
}));

jest.mock('@/utils/gpt-validation', () => ({
  GPTValidationError: class extends Error {
    details: any;
    code: string;
    constructor(message: string, details: any, code: string) {
      super(message);
      this.details = details;
      this.code = code;
    }
  }
}));

jest.mock('@/lib/schemas/gpt-response', () => ({
  GPTResponseSchema: {
    parse: jest.fn((data) => data)
  }
}));

jest.mock('@/config/env', () => ({}));

// Mock NextRequest
jest.mock('next/server', () => ({
  NextRequest: class {
    private url: string;
    private options: any;
    constructor(url: string, options: any) {
      this.url = url;
      this.options = options;
    }
    async json() {
      return JSON.parse(this.options.body);
    }
  }
}));

// Import types and the route handler AFTER all mocks are defined
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/generate-stream/route';

describe('Generate Stream SSE API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateClinicalInput.mockReturnValue({ isValid: true, error: null });
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
  });

  it('should stream progress events for successful generation', async () => {
    const request = new NextRequest('http://localhost/api/generate-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: 'Valid clinical scenario for testing with knee pain and mobility issues'
      })
    }) as any;

    const response = await POST(request);
    
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
    
    // Read the stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const events: string[] = [];
    
    if (reader) {
      // Read a few chunks to verify progress events
      for (let i = 0; i < 3; i++) {
        const { done, value } = await reader.read();
        if (!done && value) {
          events.push(decoder.decode(value));
        }
      }
      reader.cancel();
    }
    
    // Verify we got SSE formatted events
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toContain('data: ');
    
    // Parse first event
    const firstEvent = JSON.parse(events[0].replace('data: ', '').trim());
    expect(firstEvent).toHaveProperty('stage');
    expect(firstEvent).toHaveProperty('message');
    expect(firstEvent).toHaveProperty('progress');
  });

  it('should return error event for unauthenticated requests', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User not authenticated' }
    });

    const request = new NextRequest('http://localhost/api/generate-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test prompt' })
    }) as any;

    const response = await POST(request);
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (reader) {
      const { value } = await reader.read();
      if (value) {
        const event = decoder.decode(value);
        const data = JSON.parse(event.replace('data: ', '').trim());
        
        expect(data.error).toBe('AUTHENTICATION_ERROR');
        expect(data.message).toBe('Authentication required');
      }
      reader.cancel();
    }
  });

  it('should handle validation errors', async () => {
    const request = new NextRequest('http://localhost/api/generate-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Short' }) // Too short
    }) as any;

    const response = await POST(request);
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (reader) {
      const { value } = await reader.read();
      if (value) {
        const event = decoder.decode(value);
        const data = JSON.parse(event.replace('data: ', '').trim());
        
        expect(data.error).toBe('VALIDATION_ERROR');
        expect(data.message).toContain('at least 20 characters');
      }
      reader.cancel();
    }
  });

  it('should record timing metrics', async () => {
    const request = new NextRequest('http://localhost/api/generate-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: 'Valid clinical scenario for testing with patient details and symptoms'
      })
    }) as any;

    await POST(request);
    
    // Let the stream complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify metrics were recorded
    expect(mockSupabaseFrom).toHaveBeenCalledWith('generation_metrics');
    expect(mockSupabaseInsert).toHaveBeenCalled();
  });

  it('should handle cancellation gracefully', async () => {
    const request = new NextRequest('http://localhost/api/generate-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: 'Valid clinical scenario for testing cancellation'
      })
    }) as any;

    const response = await POST(request);
    
    const reader = response.body?.getReader();
    
    if (reader) {
      // Cancel immediately
      await reader.cancel();
      
      // Verify no errors thrown
      expect(true).toBe(true);
    }
  });
}); 