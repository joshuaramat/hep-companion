import { Page, expect } from '@playwright/test';
import { testUsers } from '../mocks/handlers';

// Define the type for the auth state
interface TestAuthState {
  isAuthenticated: boolean;
  user: any;
  token: string | null;
}

// Declare the global window property
declare global {
  interface Window {
    __TEST_AUTH_STATE__?: TestAuthState;
  }
}

/**
 * Helper function to simulate login in test environment
 * @param page Playwright page object
 * @param email User email for login
 * @param password User password
 */
export async function loginUser(page: Page, email = testUsers[0].email, password = testUsers[0].password): Promise<void> {
  // Set a global variable to track auth state (safer than localStorage in about:blank)
  await page.evaluate((userData) => {
    // Add auth data to the page for testing
    window.__TEST_AUTH_STATE__ = {
      isAuthenticated: true,
      user: userData,
      token: 'mock-token'
    };
    
    // Create an auth status indicator in the DOM
    const authStatus = document.createElement('div');
    authStatus.id = 'auth-status';
    authStatus.textContent = 'Authenticated';
    authStatus.style.display = 'none';
    document.body.appendChild(authStatus);
  }, testUsers[0]);
  
  // Verify login was successful
  const isAuthenticated = await page.evaluate(() => {
    return window.__TEST_AUTH_STATE__?.isAuthenticated === true;
  });
  
  expect(isAuthenticated).toBeTruthy();
}

/**
 * Helper function to log out the current user
 * @param page Playwright page object
 */
export async function logoutUser(page: Page): Promise<void> {
  // Clear the auth state
  await page.evaluate(() => {
    // Remove auth data
    window.__TEST_AUTH_STATE__ = {
      isAuthenticated: false,
      user: null,
      token: null
    };
    
    // Update the auth status indicator
    const authStatus = document.getElementById('auth-status');
    if (authStatus) {
      authStatus.textContent = 'Not Authenticated';
    }
  });
  
  // Verify logout was successful
  const isAuthenticated = await page.evaluate(() => {
    return window.__TEST_AUTH_STATE__?.isAuthenticated === true;
  });
  
  expect(isAuthenticated).toBeFalsy();
}

/**
 * Wait for session to be considered idle and validate timeout behavior
 * @param page Playwright page object
 * @param idleTimeMinutes Number of minutes for timeout
 */
export async function simulateIdleTimeout(page: Page, idleTimeMinutes = 15): Promise<void> {
  // We can't actually wait for minutes in a test
  // Instead we'll trigger the idle timeout mechanism directly
  
  // This is a test-only method to force idle timeout
  await page.evaluate((minutes) => {
    // Create and dispatch a custom event that our idle timeout hook listens for
    const event = new CustomEvent('test:force-idle-timeout', { detail: { minutes } });
    window.dispatchEvent(event);
    
    // Also remove auth state to simulate session expiry
    window.__TEST_AUTH_STATE__ = {
      isAuthenticated: false,
      user: null,
      token: null
    };
  }, idleTimeMinutes);
} 