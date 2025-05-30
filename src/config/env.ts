import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Node.js environment
  NODE_ENV: z.enum(['development', 'production', 'test'], {
    errorMap: () => ({ message: 'NODE_ENV must be one of: development, production, test' })
  }),
  
  // Supabase configuration (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string({
    required_error: 'NEXT_PUBLIC_SUPABASE_URL is required for database connectivity'
  }).url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string({
    required_error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required for database authentication'
  }).min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty'),
  
  // Supabase service role key (optional for some operations)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // OpenAI API key (required for AI functionality)
  OPENAI_API_KEY: z.string({
    required_error: 'OPENAI_API_KEY is required for AI-powered exercise generation'
  }).min(1, 'OPENAI_API_KEY cannot be empty'),
  
  // Next.js URLs (optional, with defaults)
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  VERCEL_URL: z.string().optional(),
});

// Extract the type for type safety
export type EnvConfig = z.infer<typeof envSchema>;

// Validation function
export function validateEnv(): EnvConfig {
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
      
      // In production or when explicitly requested, throw an error to crash the app
      if (process.env.NODE_ENV === 'production' || process.env.FAIL_ON_ENV_ERROR === 'true') {
        throw new Error(`Environment validation failed:\n${errorSummary}`);
      }
      
      // In development, log the error but don't crash (for better DX)
      throw new Error(`Environment validation failed. Check console for details.`);
    }
    
    throw error;
  }
}

// Export the validated environment
export const env = validateEnv();

// Helper function to check if we're in a specific environment
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

// Helper to get base URL
export function getBaseUrl(): string {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return 'http://localhost:3000';
} 