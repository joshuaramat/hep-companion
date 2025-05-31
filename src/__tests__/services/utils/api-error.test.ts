import { APIError, retryWithExponentialBackoff, MAX_RETRIES, RETRY_DELAY } from '@/services/utils/api-error';

describe('API Error Utilities', () => {
  describe('APIError', () => {
    it('should create an error with status and message', () => {
      const error = new APIError('Not found', 404);
      
      expect(error.message).toBe('Not found');
      expect(error._status).toBe(404);
      expect(error.name).toBe('APIError');
    });
    
    it('should create an error with status, message and code', () => {
      const error = new APIError('Bad request', 400, 'VALIDATION_ERROR');
      
      expect(error.message).toBe('Bad request');
      expect(error._status).toBe(400);
      expect(error._code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('APIError');
    });
  });
  
  describe('retryWithExponentialBackoff', () => {
    // Use real timers since fake timers are causing issues with promise rejection handling
    it('should return result if function succeeds on first try', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithExponentialBackoff(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
    
    it('should retry and succeed eventually', async () => {
      // Mock function that fails twice then succeeds
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Failed 1'))
        .mockRejectedValueOnce(new Error('Failed 2'))
        .mockResolvedValue('success');
      
      // Use a very small delay for tests
      const result = await retryWithExponentialBackoff(mockFn, MAX_RETRIES, 10);
      
      // Verify all retries happened
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(result).toBe('success');
    });
    
    it('should throw error after max retries', async () => {
      // Error to be thrown
      const testError = new Error('Test persistent failure');
      
      // Mock function that always fails
      const mockFn = jest.fn().mockRejectedValue(testError);
      
      // Use a very small delay for tests
      try {
        await retryWithExponentialBackoff(mockFn, 2, 10);
        // Should not reach here
        fail('Expected function to throw');
      } catch (error) {
        // Verify the function was called the expected number of times
        expect(mockFn).toHaveBeenCalledTimes(3); // Initial call + 2 retries
        expect(error).toBe(testError);
      }
    });
    
    it('should respect custom retry count and delay', async () => {
      // Mock function that always fails
      const testError = new Error('Test custom retry failure');
      const mockFn = jest.fn().mockRejectedValue(testError);
      
      // Custom retry parameters
      const customRetries = 1;
      const customDelay = 10;
      
      // Use try/catch to properly handle the expected rejection
      try {
        await retryWithExponentialBackoff(mockFn, customRetries, customDelay);
        // Should not reach here
        fail('Expected function to throw');
      } catch (error) {
        // Should have made exactly 2 attempts (initial + 1 retry)
        expect(mockFn).toHaveBeenCalledTimes(customRetries + 1);
        expect(error).toBe(testError);
      }
    });
  });
}); 