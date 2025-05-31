/**
 * Maximum number of retries
 */
export const MAX_RETRIES = 3;

/**
 * Base delay in milliseconds
 */
export const BASE_DELAY = 1000;

/**
 * Error class for OpenAI API errors
 */
export class OpenAIAPIError extends Error {
  constructor(
    message: string,
    public _status: number,
    public _retryable: boolean = false
  ) {
    super(message);
    this.name = 'OpenAIAPIError';
  }
}

/**
 * Retries a function with exponential backoff
 * @param fn - The function to retry
 * @param retries - The number of retries
 * @param delay - The base delay in milliseconds
 * @returns The result of the function
 * @throws The error if all retries fail
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = BASE_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Check if we should retry
    const isRetryable = error instanceof OpenAIAPIError && error._retryable;
    
    if (retries <= 0 || !isRetryable) {
      throw error;
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with exponential backoff
    return retryWithExponentialBackoff(fn, retries - 1, delay * 2);
  }
} 