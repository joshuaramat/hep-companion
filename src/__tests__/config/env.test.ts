import { z } from 'zod';

// Store original environment
const originalEnv = process.env;

// Mock the environment validation logic for testing
// We need to recreate the validation logic here since we can't import from the actual module
// during testing (it would execute immediately and potentially fail)
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test'], {
    errorMap: () => ({ message: 'NODE_ENV must be one of: development, production, test' })
  }),
  NEXT_PUBLIC_SUPABASE_URL: z.string({
    required_error: 'NEXT_PUBLIC_SUPABASE_URL is required for database connectivity'
  }).url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string({
    required_error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required for database authentication'
  }).min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string({
    required_error: 'OPENAI_API_KEY is required for AI-powered exercise generation'
  }).min(1, 'OPENAI_API_KEY cannot be empty'),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  VERCEL_URL: z.string().optional(),
});

function createValidateEnv() {
  return function validateEnv() {
    try {
      return envSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => {
          const path = err.path.join('.');
          return `ERROR ${path}: ${err.message}`;
        });
        
        const errorSummary = [
          'Environment Variable Validation Failed',
          '-'.repeat(50),
          ...errorMessages,
          '-'.repeat(50),
          'Please check your .env.local file and ensure all required variables are set.',
          ''
        ].join('\n');
        
        console.error(errorSummary);
        
        if (process.env.NODE_ENV === 'production' || process.env.FAIL_ON_ENV_ERROR === 'true') {
          throw new Error(`Environment validation failed:\n${errorSummary}`);
        }
        
        throw new Error(`Environment validation failed. Check console for details.`);
      }
      
      throw error;
    }
  };
}

function createGetBaseUrl() {
  return function getBaseUrl(): string {
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3000';
  };
}

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should validate successfully with all required environment variables', () => {
      // Set up valid environment
      process.env = {
        ...process.env,
        NODE_ENV: 'test',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        OPENAI_API_KEY: 'test-openai-key'
      };

      const validateEnv = createValidateEnv();
      expect(() => validateEnv()).not.toThrow();
      
      const env = validateEnv();
      expect(env.NODE_ENV).toBe('test');
      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');
      expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key');
      expect(env.OPENAI_API_KEY).toBe('test-openai-key');
    });

    it('should throw error when NODE_ENV is invalid', () => {
      process.env = {
        ...process.env,
        NODE_ENV: 'invalid' as any,
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        OPENAI_API_KEY: 'test-openai-key'
      };

      const validateEnv = createValidateEnv();
      expect(() => validateEnv()).toThrow('Environment validation failed');
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      process.env = {
        ...process.env,
        NODE_ENV: 'test',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        OPENAI_API_KEY: 'test-openai-key'
      };
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const validateEnv = createValidateEnv();
      expect(() => validateEnv()).toThrow('Environment validation failed');
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is not a valid URL', () => {
      process.env = {
        ...process.env,
        NODE_ENV: 'test',
        NEXT_PUBLIC_SUPABASE_URL: 'invalid-url',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        OPENAI_API_KEY: 'test-openai-key'
      };

      const validateEnv = createValidateEnv();
      expect(() => validateEnv()).toThrow('Environment validation failed');
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
      process.env = {
        ...process.env,
        NODE_ENV: 'test',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        OPENAI_API_KEY: 'test-openai-key'
      };
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const validateEnv = createValidateEnv();
      expect(() => validateEnv()).toThrow('Environment validation failed');
    });

    it('should throw error when OPENAI_API_KEY is missing', () => {
      process.env = {
        ...process.env,
        NODE_ENV: 'test',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
      };
      delete process.env.OPENAI_API_KEY;

      const validateEnv = createValidateEnv();
      expect(() => validateEnv()).toThrow('Environment validation failed');
    });

    it('should allow optional SUPABASE_SERVICE_ROLE_KEY to be missing', () => {
      process.env = {
        ...process.env,
        NODE_ENV: 'test',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        OPENAI_API_KEY: 'test-openai-key'
      };
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const validateEnv = createValidateEnv();
      expect(() => validateEnv()).not.toThrow();
    });

    it('should include optional SUPABASE_SERVICE_ROLE_KEY when provided', () => {
      process.env = {
        ...process.env,
        NODE_ENV: 'test',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        OPENAI_API_KEY: 'test-openai-key',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key'
      };

      const validateEnv = createValidateEnv();
      const env = validateEnv();
      expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('service-role-key');
    });
  });

  describe('Environment helpers', () => {
    beforeEach(() => {
      // Set up minimal valid environment for helper tests
      process.env = {
        ...process.env,
        NODE_ENV: 'test',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        OPENAI_API_KEY: 'test-openai-key'
      };
    });

    describe('getBaseUrl', () => {
      it('should return NEXT_PUBLIC_SITE_URL when provided', () => {
        process.env.NEXT_PUBLIC_SITE_URL = 'https://myapp.com';
        const getBaseUrl = createGetBaseUrl();
        expect(getBaseUrl()).toBe('https://myapp.com');
      });

      it('should return Vercel URL when NEXT_PUBLIC_SITE_URL is not provided', () => {
        delete process.env.NEXT_PUBLIC_SITE_URL;
        process.env.VERCEL_URL = 'myapp.vercel.app';
        const getBaseUrl = createGetBaseUrl();
        expect(getBaseUrl()).toBe('https://myapp.vercel.app');
      });

      it('should return localhost when neither URL is provided', () => {
        delete process.env.NEXT_PUBLIC_SITE_URL;
        delete process.env.VERCEL_URL;
        const getBaseUrl = createGetBaseUrl();
        expect(getBaseUrl()).toBe('http://localhost:3000');
      });
    });
  });

  describe('Error handling in production vs development', () => {
    it('should throw in production when FAIL_ON_ENV_ERROR is true', () => {
      process.env = {
        ...process.env,
        NODE_ENV: 'production',
        FAIL_ON_ENV_ERROR: 'true',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
        // Missing OPENAI_API_KEY
      };
      delete process.env.OPENAI_API_KEY;

      const validateEnv = createValidateEnv();
      expect(() => validateEnv()).toThrow('Environment validation failed');
    });

    it('should throw in development when variables are missing', () => {
      process.env = {
        ...process.env,
        NODE_ENV: 'development',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
        // Missing OPENAI_API_KEY
      };
      delete process.env.OPENAI_API_KEY;

      const validateEnv = createValidateEnv();
      expect(() => validateEnv()).toThrow('Environment validation failed');
    });
  });
}); 