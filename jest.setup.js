// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock web Request/Response globals for Node.js environment
class MockRequest {
  url;
  method;
  headers;
  body;
  // Add stubs for required Request interface properties
  cache = 'default';
  credentials = 'same-origin';
  destination = '';
  integrity = '';
  keepalive = false;
  mode = 'cors';
  redirect = 'follow';
  referrer = '';
  referrerPolicy = '';
  signal = { aborted: false };
  bodyUsed = false;
  
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body || null;
  }

  json() {
    if (typeof this.body === 'string' && this.body !== 'invalid-json') {
      return Promise.resolve(JSON.parse(this.body));
    } else {
      return Promise.reject(new Error('Invalid JSON'));
    }
  }
  
  // Stub implementations for required methods
  clone() { return this; }
  arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
  blob() { return Promise.resolve(new Blob()); }
  formData() { return Promise.resolve(new FormData()); }
  text() { return Promise.resolve(''); }
}

class MockHeaders {
  headers = {};
  
  constructor(init) {
    if (init) {
      Object.keys(init).forEach(key => {
        this.headers[key.toLowerCase()] = init[key];
      });
    }
  }

  get(name) {
    return this.headers[name.toLowerCase()] || null;
  }
  
  // Add stubs for required Headers interface methods
  append(name, value) {
    this.headers[name.toLowerCase()] = value;
  }
  
  delete(name) {
    delete this.headers[name.toLowerCase()];
  }
  
  forEach(callbackfn) {
    Object.entries(this.headers).forEach(([key, value]) => callbackfn(value, key, this));
  }
  
  has(name) {
    return name.toLowerCase() in this.headers;
  }
  
  set(name, value) {
    this.headers[name.toLowerCase()] = value;
  }
  
  getSetCookie() { 
    return []; 
  }
  
  // Iterator methods
  entries() {
    return Object.entries(this.headers)[Symbol.iterator]();
  }
  
  keys() {
    return Object.keys(this.headers)[Symbol.iterator]();
  }
  
  values() {
    return Object.values(this.headers)[Symbol.iterator]();
  }
  
  [Symbol.iterator]() {
    return this.entries();
  }
}

// Use type assertion to avoid TypeScript errors
global.Request = MockRequest;
global.Headers = MockHeaders;

// Simple mocks that don't reference out-of-scope variables
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '',
}));

// Simple mock for nanoid
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-12345',
}));

// Set up aliases to avoid circular reference issues in API tests
global.mockSupabase = () => {
  const mockAuth = {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })
  };
  
  const mockFrom = jest.fn();
  
  const client = {
    auth: mockAuth,
    from: mockFrom
  };
  
  return { client, mockAuth, mockFrom };
};

// Helper to create a simple success response
global.createSuccessResponse = (data) => ({
  data,
  error: null
});

// Helper to create an error response
global.createErrorResponse = (message, status = 400) => ({
  data: null,
  error: { message, status }
}); 