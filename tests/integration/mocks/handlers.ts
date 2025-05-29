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
    
    const body = await request.json();
    // Check if this is a login request
    if (body.grant_type === 'password') {
      const { email, password } = body;
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
    const body = await request.json();
    const searchTerm = body.search_term?.toLowerCase() || '';
    
    // Filter organizations based on search term
    const results = testOrganizations.filter(org => 
      org.name.toLowerCase().includes(searchTerm) || 
      org.clinic_id.toLowerCase().includes(searchTerm)
    );
    
    return HttpResponse.json(results);
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
      if (!body?.prompt || body.prompt.length < 10) {
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