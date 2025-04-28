/**
 * Simple logger utility for standardized application logging
 */
export const logger = {
  /**
   * Log informational message
   */
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  
  /**
   * Log warning message
   */
  warn: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  /**
   * Log error message
   */
  error: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  
  /**
   * Log debug message (only in development environment)
   */
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}; 