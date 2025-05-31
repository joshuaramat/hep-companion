import { 
  retryWithExponentialBackoff, 
  OpenAIAPIError
} from '@/utils/retry';

// Mock the retryWithExponentialBackoff function to skip the delay
jest.mock('@/utils/retry', () => {
  const originalModule = jest.requireActual('@/utils/retry');
  return {
    ...originalModule,
    retryWithExponentialBackoff: async (fn: () => Promise<any>, retries = 3) => {
      try {
        return await fn();
      } catch (error: unknown) {
        if (retries <= 0 || !(error instanceof originalModule.OpenAIAPIError) || !(error as OpenAIAPIError)._retryable) {
          throw error;
        }
        return originalModule.retryWithExponentialBackoff(fn, retries - 1, 0);
      }
    },
  };
});

describe('Retry Utility', () => {
  it('returns successful results immediately', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    
    const result = await retryWithExponentialBackoff(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
  
  it('does not retry non-retryable errors', async () => {
    const mockError = new OpenAIAPIError('Non-retryable error', 400, false);
    const mockFn = jest.fn().mockRejectedValue(mockError);
    
    await expect(retryWithExponentialBackoff(mockFn)).rejects.toThrow(mockError);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('retries retryable errors until success', async () => {
    const mockError = new OpenAIAPIError('Retryable error', 429, true);
    const mockFn = jest.fn()
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValue('success after retries');
    
    const result = await retryWithExponentialBackoff(mockFn, 3);
    
    expect(result).toBe('success after retries');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });
  
  it('retries retryable errors until max retries reached', async () => {
    const mockError = new OpenAIAPIError('Retryable error', 429, true);
    const mockFn = jest.fn().mockRejectedValue(mockError);
    
    await expect(retryWithExponentialBackoff(mockFn, 3)).rejects.toThrow(mockError);
    expect(mockFn).toHaveBeenCalledTimes(4); // Initial attempt + 3 retries
  });
  
  it('handles rate limit errors as retryable', async () => {
    const rateLimitError = new OpenAIAPIError('Rate limit exceeded', 429, true);
    const mockFn = jest.fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValue('success after rate limit');
    
    const result = await retryWithExponentialBackoff(mockFn);
    
    expect(result).toBe('success after rate limit');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
  
  it('handles server errors as retryable', async () => {
    const serverError = new OpenAIAPIError('Internal server error', 500, true);
    const mockFn = jest.fn()
      .mockRejectedValueOnce(serverError)
      .mockResolvedValue('success after server error');
    
    const result = await retryWithExponentialBackoff(mockFn);
    
    expect(result).toBe('success after server error');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
  
  it('handles non-OpenAIAPIError errors without retrying', async () => {
    const regularError = new Error('Regular error');
    const mockFn = jest.fn().mockRejectedValue(regularError);
    
    await expect(retryWithExponentialBackoff(mockFn)).rejects.toThrow(regularError);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
}); 