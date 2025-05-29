import { expect, type Page } from '@playwright/test';
import { setupAppEnvironment } from './utils/app-environment';

// This file contains setup that runs before all tests
async function globalSetup() {
  console.log('Setting up global test environment...');
  console.log('Node version:', process.version);
  console.log('Environment:', process.env.NODE_ENV);

  // Log available environment variables (without sensitive values)
  const safeEnvVars = { 
    NODE_ENV: process.env.NODE_ENV,
    TEST_ENVIRONMENT: 'Simulated App Environment',
  };

  console.log('Environment variables status:', safeEnvVars);
}

export default globalSetup;

/**
 * Helper to set up page logging for debugging
 */
export const setupPageLogging = (page: Page): void => {
  // Set up error logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser console error: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', exception => {
    console.error(`Uncaught exception: ${exception.message}`);
  });
  
  // Also log request failures
  page.on('requestfailed', request => {
    console.error(`Failed request: ${request.url()}`);
    console.error(`Failure reason: ${request.failure()?.errorText}`);
  });
};

/**
 * Helper to set up a test page with app environment
 */
export const setupTestPage = async (page: Page): Promise<Page> => {
  // Set up page logging
  setupPageLogging(page);
  
  // Set up app environment
  return await setupAppEnvironment(page);
}; 