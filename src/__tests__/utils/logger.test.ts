import { logger } from '@/utils/logger';

describe('Logger Utility', () => {
  beforeEach(() => {
    // Save original console methods
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('info method', () => {
    it('should log info messages with proper format', () => {
      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set to non-test environment to allow logging
      process.env.NODE_ENV = 'development';
      
      logger.info('Test info message');
      
      expect(console.info).toHaveBeenCalledWith('[INFO] Test info message');
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not log in test environment', () => {
      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set to test environment
      process.env.NODE_ENV = 'test';
      
      logger.info('Test info message');
      
      expect(console.info).not.toHaveBeenCalled();
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should include additional arguments', () => {
      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set to non-test environment
      process.env.NODE_ENV = 'development';
      
      const additionalData = { user: 'test', action: 'login' };
      logger.info('User login', additionalData);
      
      expect(console.info).toHaveBeenCalledWith(
        '[INFO] User login', 
        additionalData
      );
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('warn method', () => {
    it('should log warning messages with proper format', () => {
      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set to non-test environment
      process.env.NODE_ENV = 'development';
      
      logger.warn('Test warning message');
      
      expect(console.warn).toHaveBeenCalledWith('[WARN] Test warning message');
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not log in test environment', () => {
      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set to test environment
      process.env.NODE_ENV = 'test';
      
      logger.warn('Test warning message');
      
      expect(console.warn).not.toHaveBeenCalled();
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('error method', () => {
    it('should log error messages with proper format', () => {
      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set to non-test environment
      process.env.NODE_ENV = 'development';
      
      logger.error('Test error message');
      
      expect(console.error).toHaveBeenCalledWith('[ERROR] Test error message');
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not log in test environment', () => {
      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set to test environment
      process.env.NODE_ENV = 'test';
      
      logger.error('Test error message');
      
      expect(console.error).not.toHaveBeenCalled();
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('debug method', () => {
    it('should log debug messages in development environment', () => {
      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set to development environment
      process.env.NODE_ENV = 'development';
      
      logger.debug('Test debug message');
      
      expect(console.debug).toHaveBeenCalledWith('[DEBUG] Test debug message');
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not log debug messages in production environment', () => {
      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set to production environment
      process.env.NODE_ENV = 'production';
      
      logger.debug('Test debug message');
      
      expect(console.debug).not.toHaveBeenCalled();
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not log debug messages in test environment', () => {
      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set to test environment
      process.env.NODE_ENV = 'test';
      
      logger.debug('Test debug message');
      
      expect(console.debug).not.toHaveBeenCalled();
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
}); 