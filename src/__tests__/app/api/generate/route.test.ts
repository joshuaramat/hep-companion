/**
 * @jest-environment node
 */

// Import after mocks setup
import { POST } from '@/app/api/generate/route';

// Mock the dependencies
jest.mock('openai', () => {
  const mockCreate = jest.fn();
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }))
  };
});

// Import OpenAI after mocking
import { OpenAI } from 'openai';

describe('GPT API Route Handler', () => {
  let mockOpenAI: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the OpenAI mock instance
    mockOpenAI = new OpenAI();
  });
  
  it('validates and processes valid GPT response', async () => {
    // Prepare a valid response
    const mockValidResponse = [
      {
        exercise_name: "Quad Sets",
        sets: 3,
        reps: 10,
        frequency: "2x daily",
        citations: [
          {
            title: "Effectiveness of exercise therapy",
            authors: "Smith J, Johnson B",
            journal: "Journal of Physical Therapy",
            year: "2022",
            doi: "10.1234/jpt.2022.01",
            url: "https://example.com/article"
          }
        ]
      }
    ];

    // Setup OpenAI mock to return valid response
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(mockValidResponse)
          }
        }
      ]
    });

    // Create request
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test prompt' })
    });

    // Execute
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.suggestions.length).toBe(1);
    expect(data.suggestions[0].exercise_name).toBe('Quad Sets');
    expect(data.suggestions[0].citations).toBeTruthy();
    expect(data.suggestions[0].id).toBeTruthy();
  });

  it('handles malformed JSON response from OpenAI', async () => {
    // Setup OpenAI mock to return invalid JSON
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'This is not valid JSON'
          }
        }
      ]
    });

    // Create request
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test prompt' })
    });

    // Execute
    const response = await POST(request);
    
    // Assert
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid JSON');
  });

  it('handles missing required fields in GPT response', async () => {
    // Prepare an invalid response (missing required fields)
    const mockInvalidResponse = [
      {
        // Missing exercise_name
        sets: 3,
        reps: 10,
        frequency: "2x daily",
        citations: []
      }
    ];

    // Setup OpenAI mock
    const { OpenAI } = require('openai');
    const mockOpenAI = new OpenAI();
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(mockInvalidResponse)
          }
        }
      ]
    });

    // Create request
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test prompt' })
    });

    // Execute
    const response = await POST(request);
    
    // Assert
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('missing or invalid exercise_name');
  });

  it('handles non-array response from GPT', async () => {
    // Prepare a non-array response
    const mockNonArrayResponse = {
      exercise_name: "Quad Sets",
      sets: 3,
      reps: 10,
      frequency: "2x daily",
      citations: []
    };

    // Setup OpenAI mock
    const { OpenAI } = require('openai');
    const mockOpenAI = new OpenAI();
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(mockNonArrayResponse)
          }
        }
      ]
    });

    // Create request
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test prompt' })
    });

    // Execute
    const response = await POST(request);
    
    // Assert
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('expected an array');
  });

  it('handles OpenAI API errors gracefully', async () => {
    // Setup OpenAI mock to throw an error
    const { OpenAI } = require('openai');
    const mockOpenAI = new OpenAI();
    mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('API Error'));

    // Create request
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test prompt' })
    });

    // Execute
    const response = await POST(request);
    
    // Assert
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('API Error');
  });
}); 