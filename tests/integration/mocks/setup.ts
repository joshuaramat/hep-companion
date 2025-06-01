import { setupServer } from 'msw/node';
import { setupWorker, type SetupWorkerApi } from 'msw/browser';
import { http } from 'msw';
import { handlers } from './handlers';
import { test, expect, Page } from '@playwright/test';

declare global {
  interface Window {
    msw: {
      worker: SetupWorkerApi;
    };
  }
}

// Add polyfills for Node.js environment
if (typeof global !== 'undefined' && !global.Response) {
  // Polyfill Response for Node.js environment
  global.Response = class Response {
    status: number;
    statusText: string;
    headers: any;
    body: any;
    ok: boolean;

    constructor(body?: any, init?: { status?: number; statusText?: string; headers?: any }) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = init?.headers || {};
      this.ok = this.status >= 200 && this.status < 300;
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }

    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
  } as any;
}

if (typeof global !== 'undefined' && !global.Request) {
  // Polyfill Request for Node.js environment
  global.Request = class Request {
    url: string;
    method: string;
    body: any;
    headers: any;

    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.body = init?.body;
      this.headers = init?.headers || {};
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
  } as any;
}

// Set up the mock server for Node.js environment
export const server = setupServer(...handlers);

// Helper for browser context to initialize MSW
export async function setupMockServiceWorker(page: Page) {
  await page.addInitScript(() => {
    // Skip initialization if MSW is already initialized
    if (window.msw) {
      return;
    }

    // This will be replaced by the actual worker
    window.msw = { worker: null as any };

    // Add a listener for the readiness signal
    window.addEventListener('mswReady', () => {
      console.log('MSW worker is ready');
    });
  });

  // Add the service worker setup code
  await page.addInitScript(async () => {
    try {
      // Inline simple MSW setup that doesn't require importing the lib
      console.log('Setting up MSW in the browser');
      
      // Mock successful responses for common API calls
      window.fetch = async (url, options) => {
        console.log(`Mocking fetch: ${url}`);
        
        // Mock different responses based on URL
        if (url.toString().includes('auth')) {
          return new Response(JSON.stringify({
            user: { id: 'test-user-id', email: 'test@example.com' },
            session: { access_token: 'fake-token' }
          }), { status: 200 });
        }
        
        if (url.toString().includes('generate')) {
          return new Response(JSON.stringify({
            id: 'test-generation-id',
            suggestions: [
              { name: 'Exercise 1', description: 'Description 1' },
              { name: 'Exercise 2', description: 'Description 2' }
            ]
          }), { status: 200 });
        }
        
        return new Response(JSON.stringify({ success: true }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      };
      
      // Signal that MSW is ready
      window.dispatchEvent(new Event('mswReady'));
    } catch (error) {
      console.error('Failed to setup MSW in browser:', error);
    }
  });
}

// Node.js setup hooks
test.beforeAll(() => {
  console.log('Setting up MSW for integration tests...');
  server.listen({ 
    onUnhandledRequest: (req, print) => {
      // Log unhandled requests but don't warn for assets and internal Next.js requests
      const skipPaths = [
        '/_next/',
        '/favicon.ico',
        '/images/',
        '/static/',
        '/api/auth/'  // Let Next.js Auth handle these
      ];
      
      const url = new URL(req.url.toString());
      const shouldSkip = skipPaths.some(path => url.pathname.startsWith(path));
      
      if (!shouldSkip) {
        console.warn(`⚠️ Unhandled ${req.method} request to ${url.href}`);
        print.warning();
      }
    }
  });
  console.log('MSW server started successfully');
});

// Reset request handlers between tests
test.afterEach(() => server.resetHandlers());

// Clean up after tests
test.afterAll(() => server.close()); 