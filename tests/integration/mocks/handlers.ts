import { http, HttpResponse, delay } from 'msw';

// Mock test data
export const testUsers = [
  { id: 'test-user-id', email: 'test@example.com', password: 'password123' },
  { id: 'admin-user-id', email: 'admin@example.com', password: 'password123' }
];

export const testOrganizations = [
  { id: 'org-1', name: 'Test Clinic', clinic_id: 'CLINIC-1' },
  { id: 'org-2', name: 'Research Hospital', clinic_id: 'CLINIC-2' }
];

// Mock exercise suggestions for test data
export const mockExerciseSuggestions = [
  {
    name: "Core Strengthening with Resistance Band",
    description: "A gentle exercise to strengthen core muscles with minimal equipment.",
    instructions: [
      "Sit on a chair or at the edge of your bed",
      "Place the resistance band around your back and hold each end with your hands",
      "Engage your core by sitting up tall",
      "Slowly push both arms forward against the resistance of the band",
      "Hold for 3 seconds and return to starting position",
      "Repeat 10 times, 2-3 sets daily"
    ],
    precautions: "Stop if you feel sharp pain. Keep movements slow and controlled.",
    progression: "Increase resistance by shortening the band or using a stronger band."
  },
  {
    name: "Modified Bridging Exercise",
    description: "Helps strengthen lower back and glutes while lying down.",
    instructions: [
      "Lie on your back with knees bent and feet flat on the floor/bed",
      "Tighten your abdominal muscles and buttocks",
      "Slowly lift your hips off the floor/bed to create a straight line from shoulders to knees",
      "Hold for 5 seconds while breathing normally",
      "Slowly lower back down",
      "Repeat 10 times, 2 sets daily"
    ],
    precautions: "Avoid arching your back excessively. Keep movements controlled.",
    progression: "Increase hold time to 10 seconds as you get stronger."
  }
];

export const handlers = [
  // Supabase Authentication
  http.post('https://*.supabase.co/auth/v1/token', async ({ request }) => {
    await delay(200);
    
    try {
      const body = await request.json();
      // Check if this is a login request
      if (body && typeof body === 'object' && 'grant_type' in body && body.grant_type === 'password') {
        const { email, password } = body as { email: string; password: string; grant_type: string };
        const user = testUsers.find(u => u.email === email && u.password === password);
        
        if (user) {
          return HttpResponse.json({
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            user
          });
        } else {
          return new HttpResponse(null, {
            status: 401,
            statusText: 'Unauthorized'
          });
        }
      }
    } catch (error) {
      // If JSON parsing fails, return default response
    }
    
    // Default success response for other token requests
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      user: testUsers[0]
    });
  }),
  
  http.post('https://*.supabase.co/auth/v1/logout', async () => {
    await delay(100);
    return HttpResponse.json({ success: true });
  }),
  
  // Supabase User
  http.get('https://*.supabase.co/auth/v1/user', () => {
    return HttpResponse.json({
      id: testUsers[0].id,
      email: testUsers[0].email,
      app_metadata: { provider: 'email' },
      user_metadata: {},
      aud: 'authenticated'
    });
  }),
  
  // Session
  http.get('https://*.supabase.co/auth/v1/session', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      user: testUsers[0]
    });
  }),
  
  // OpenAI API
  http.post('https://api.openai.com/v1/chat/completions', async () => {
    await delay(500); // Simulate AI processing time
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: JSON.stringify(mockExerciseSuggestions)
          }
        }
      ]
    });
  }),
  
  // Supabase Organizations
  http.get('https://*.supabase.co/rest/v1/organizations', () => {
    return HttpResponse.json(testOrganizations);
  }),
  
  http.post('https://*.supabase.co/rest/v1/rpc/search_organizations', async ({ request }) => {
    try {
      const body = await request.json();
      const searchTerm = (body && typeof body === 'object' && 'search_term' in body) 
        ? String(body.search_term).toLowerCase() 
        : '';
      
      // Filter organizations based on search term
      const results = testOrganizations.filter(org => 
        org.name.toLowerCase().includes(searchTerm) || 
        org.clinic_id.toLowerCase().includes(searchTerm)
      );
      
      return HttpResponse.json(results);
    } catch (error) {
      return HttpResponse.json([]);
    }
  }),
  
  // Supabase Prompt Storage
  http.post('https://*.supabase.co/rest/v1/prompts', () => {
    return HttpResponse.json({ id: 'test-prompt-id' });
  }),
  
  // Supabase Feedback
  http.post('https://*.supabase.co/rest/v1/feedback', () => {
    return HttpResponse.json({ id: 'test-feedback-id' });
  }),
  
  // Next.js API Routes
  http.post('*/api/generate', async ({ request }) => {
    await delay(500);
    try {
      const body = await request.json();
      // Check minimal validation for prompt
      if (!body || typeof body !== 'object' || !('prompt' in body) || 
          typeof body.prompt !== 'string' || body.prompt.length < 10) {
        return HttpResponse.json(
          { error: 'Invalid prompt', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      
      return HttpResponse.json({
        id: 'test-generation-id',
        suggestions: mockExerciseSuggestions
      });
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to process request', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }
  }),
  
  // New SSE endpoint for streaming generation
  http.post('*/api/generate-stream', async ({ request }) => {
    try {
      const body = await request.json();
      
      // Validation
      if (!body || typeof body !== 'object' || !('prompt' in body) || 
          typeof body.prompt !== 'string' || body.prompt.length < 20) {
        const encoder = new TextEncoder();
        const errorEvent = encoder.encode(
          `data: ${JSON.stringify({
            stage: 'started',
            message: 'Please provide more detailed information',
            progress: 0,
            error: 'VALIDATION_ERROR'
          })}\n\n`
        );
        
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(errorEvent);
              controller.close();
            }
          }),
          {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            }
          }
        );
      }
      
      // Simulate SSE stream
      const encoder = new TextEncoder();
      let sent = 0;
      
      const events = [
        { stage: 'started', message: 'Starting...', progress: 5 },
        { stage: 'fetching-exercises', message: 'Loading exercises...', progress: 15 },
        { stage: 'generating', message: 'Generating recommendations...', progress: 40 },
        { stage: 'validating', message: 'Validating...', progress: 70 },
        { stage: 'storing', message: 'Saving...', progress: 85 },
        { stage: 'complete', message: 'Complete!', progress: 100 },
      ];
      
      return new Response(
        new ReadableStream({
          async start(controller) {
            // Send progress events
            for (const event of events) {
              await delay(100);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
              );
            }
            
            // Send final result
            await delay(100);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'result',
                data: {
                  id: 'test-generation-id',
                  exercises: mockExerciseSuggestions
                }
              })}\n\n`)
            );
            
            controller.close();
          }
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        }
      );
    } catch (error) {
      return new Response('Error', { status: 500 });
    }
  }),
  
  http.post('*/api/feedback', async ({ request }) => {
    await delay(200);
    try {
      const body = await request.json();
      return HttpResponse.json({
        success: true,
        id: 'test-feedback-id'
      });
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to process feedback', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }
  }),
  
  http.get('*/api/organizations/search', async ({ request }) => {
    await delay(200);
    
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    
    if (query.length < 2) {
      return HttpResponse.json(
        { error: 'Search query too short', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    
    // Filter organizations based on query
    const results = testOrganizations.filter(org => 
      org.name.toLowerCase().includes(query.toLowerCase()) || 
      org.clinic_id.toLowerCase().includes(query.toLowerCase())
    );
    
    return HttpResponse.json({
      success: true,
      data: results
    });
  }),
  
  // Handle auth middleware check endpoints
  http.get('*/api/auth/session', async () => {
    await delay(100);
    return HttpResponse.json({
      user: testUsers[0],
      expires: new Date(Date.now() + 3600 * 1000).toISOString()
    });
  }),
  
  // Catch-all handler for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled request: ${request.method} ${request.url}`);
    return HttpResponse.json(
      { error: 'Not implemented in test environment' },
      { status: 501 }
    );
  })
]; 