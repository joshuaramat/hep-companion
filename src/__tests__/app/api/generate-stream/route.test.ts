/**
 * Tests for the generate-stream SSE API route.
 */

// Mock all dependencies first
jest.mock('@/services/audit', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('@/utils/patient-key', () => ({
  generatePatientKey: jest.fn().mockReturnValue('mocked-patient-key')
}));

jest.mock('@/services/utils/validation', () => ({
  validateClinicalInput: jest.fn().mockReturnValue({ isValid: true, error: null })
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }
}));

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
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
        })
      }
    }
  }))
}));

jest.mock('@/services/supabase/server', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-id' },
            error: null
          })
        })
      })
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    },
    rpc: jest.fn().mockResolvedValue({
      data: [
        { stage: 'fetching-exercises', avg_duration_ms: 300 },
        { stage: 'generating', avg_duration_ms: 2000 },
        { stage: 'validating', avg_duration_ms: 100 },
        { stage: 'storing', avg_duration_ms: 200 }
      ],
      error: null
    })
  })
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

// Import after all mocks are set up
import { NextRequest } from 'next/server';

describe('Generate Stream SSE API Route', () => {
  let POST: any;
  
  beforeAll(async () => {
    // Dynamic import to ensure mocks are applied
    const routeModule = await import('@/app/api/generate-stream/route');
    POST = routeModule.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle basic SSE stream setup', async () => {
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
  });

  it('should handle authentication errors', async () => {
    // Mock auth failure
    const { createClient } = require('@/services/supabase/server');
    const mockClient = createClient();
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'User not authenticated' }
    });

    const request = new NextRequest('http://localhost/api/generate-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test prompt' })
    }) as any;

    const response = await POST(request);
    
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
  });
}); 