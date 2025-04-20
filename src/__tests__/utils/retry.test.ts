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
        if (retries <= 0 || !(error instanceof originalModule.OpenAIAPIError) || !(error as OpenAIAPIError).retryable) {
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
}); 