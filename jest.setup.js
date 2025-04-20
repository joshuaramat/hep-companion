// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

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