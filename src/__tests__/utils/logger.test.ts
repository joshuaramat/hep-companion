import { logger } from '@/utils/logger';

describe('Logger Utility', () => {
  let originalNodeEnv: string | undefined;
  
  beforeEach(() => {
    // Save original NODE_ENV value
    originalNodeEnv = process.env.NODE_ENV;
    
    // Mock console methods
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console mocks
    jest.restoreAllMocks();
    
    // Restore the environment variable
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      configurable: true
    });
  });

  describe('info method', () => {
    it('should log info messages with proper format', () => {
      // Mock environment for this test
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true
      });
      
      logger.info('Test info message');
      
      expect(console.info).toHaveBeenCalledWith('[INFO] Test info message');
    });

    it('should not log in test environment', () => {
      // Mock environment for this test
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        configurable: true
      });
      
      logger.info('Test info message');
      
      expect(console.info).not.toHaveBeenCalled();
    });

    it('should include additional arguments', () => {
      // Mock environment for this test
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true
      });
      
      const additionalData = { user: 'test', action: 'login' };
      logger.info('User login', additionalData);
      
      expect(console.info).toHaveBeenCalledWith(
        '[INFO] User login', 
        additionalData
      );
    });
  });

  describe('warn method', () => {
    it('should log warning messages with proper format', () => {
      // Mock environment for this test
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true
      });
      
      logger.warn('Test warning message');
      
      expect(console.warn).toHaveBeenCalledWith('[WARN] Test warning message');
    });

    it('should not log in test environment', () => {
      // Mock environment for this test
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        configurable: true
      });
      
      logger.warn('Test warning message');
      
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('error method', () => {
    it('should log error messages with proper format', () => {
      // Mock environment for this test
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true
      });
      
      logger.error('Test error message');
      
      expect(console.error).toHaveBeenCalledWith('[ERROR] Test error message');
    });

    it('should not log in test environment', () => {
      // Mock environment for this test
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        configurable: true
      });
      
      logger.error('Test error message');
      
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('debug method', () => {
    it('should log debug messages in development environment', () => {
      // Mock environment for this test
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true
      });
      
      logger.debug('Test debug message');
      
      expect(console.debug).toHaveBeenCalledWith('[DEBUG] Test debug message');
    });

    it('should not log debug messages in production environment', () => {
      // Mock environment for this test
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true
      });
      
      logger.debug('Test debug message');
      
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should not log debug messages in test environment', () => {
      // Mock environment for this test
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        configurable: true
      });
      
      logger.debug('Test debug message');
      
      expect(console.debug).not.toHaveBeenCalled();
    });
  });
}); 