/**
 * @jest-environment node
 */

// Setup global mocks for Next.js Edge Runtime APIs in Node.js environment
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock Web APIs that Next.js Edge Runtime provides
global.Response = class Response {
  constructor(body?: any, init?: any) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
  body: any;
  status: number;
  headers: Map<string, string>;
} as any;

global.Request = class Request {
  constructor(url: string, init?: any) {
    this.url = url;
    this.method = init?.method || 'GET';
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
  url: string;
  method: string;
  headers: Map<string, string>;
} as any;

global.Headers = Map as any;

// Mock the Supabase middleware client before importing middleware
jest.mock('../src/services/supabase/middleware', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ 
        data: { session: { user: { id: '123' } } } 
      }))
    }
  }))
}));

describe('Security Headers Middleware - Static Analysis', () => {
  it('should have correct HSTS header configuration in source code', () => {
    const fs = require('fs');
    const path = require('path');
    
    const middlewarePath = path.join(__dirname, '../src/middleware.ts');
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    
    // Verify HSTS header with exact requirements
    expect(middlewareContent).toContain('max-age=31536000; includeSubDomains; preload');
  });

  it('should have Content Security Policy configured', () => {
    const fs = require('fs');
    const path = require('path');
    
    const middlewarePath = path.join(__dirname, '../src/middleware.ts');
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    
    expect(middlewareContent).toContain('Content-Security-Policy');
    expect(middlewareContent).toContain("frame-ancestors 'none'");
    expect(middlewareContent).toContain('upgrade-insecure-requests');
  });

  it('should include all required security headers', () => {
    const fs = require('fs');
    const path = require('path');
    
    const middlewarePath = path.join(__dirname, '../src/middleware.ts');
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    
    const requiredHeaders = [
      'Strict-Transport-Security',
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'X-XSS-Protection',
      'Permissions-Policy'
    ];

    requiredHeaders.forEach(header => {
      expect(middlewareContent).toContain(header);
    });
  });

  it('should apply headers in all environments (not just production)', () => {
    const fs = require('fs');
    const path = require('path');
    
    const middlewarePath = path.join(__dirname, '../src/middleware.ts');
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    
    // Should NOT be wrapped in production-only check
    expect(middlewareContent).not.toContain("process.env.NODE_ENV === 'production'");
  });

  it('should have healthcare-appropriate CSP directives', () => {
    const fs = require('fs');
    const path = require('path');
    
    const middlewarePath = path.join(__dirname, '../src/middleware.ts');
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    
    // Healthcare/HIPAA appropriate directives
    expect(middlewareContent).toContain("default-src 'self'");
    expect(middlewareContent).toContain("object-src 'none'");
    expect(middlewareContent).toContain("base-uri 'self'");
    expect(middlewareContent).toContain("form-action 'self'");
  });
}); 