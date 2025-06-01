export class APIError extends Error {
  constructor(
    message: string,
    public _status: number = 500,
    public _code: string = 'UNKNOWN_ERROR'
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000;

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithExponentialBackoff(fn, retries - 1, delay * 2);
  }
} 