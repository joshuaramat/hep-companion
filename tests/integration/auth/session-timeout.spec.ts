import { test, expect } from '@playwright/test';
import { loginUser, simulateIdleTimeout } from '../utils/auth-helpers';
import '../mocks/setup';

test.describe('Session Timeout', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page);
  });
  
  test('should redirect to login after session timeout', async ({ page }) => {
    // Go to dashboard
    await page.goto('/dashboard');
    
    // Verify we're on the dashboard
    await expect(page.getByText('Generate Exercises')).toBeVisible();
    
    // Simulate idle timeout
    await simulateIdleTimeout(page);
    
    // Verify redirect to login page with timeout message
    await expect(page).toHaveURL(/.*\/auth\/login\?message=.*/);
    await expect(page.getByText('Your session has expired due to inactivity')).toBeVisible();
  });
  
  test('should maintain session with user activity', async ({ page }) => {
    // Go to dashboard
    await page.goto('/dashboard');
    
    // Simulate user activity by clicking different elements
    await page.click('text=Generate Exercises');
    
    // Navigate to generate page
    await page.goto('/generate');
    
    // Interact with the page to reset idle timer
    await page.click('textarea');
    
    // Verify we're still on generate page (no timeout)
    await expect(page).toHaveURL('/generate');
  });
  
  test('should use custom timeout value from configuration', async ({ page }) => {
    // Go to dashboard
    await page.goto('/dashboard');
    
    // Simulate idle timeout with custom value (5 minutes)
    await simulateIdleTimeout(page, 5);
    
    // Verify redirect to login page with timeout message
    await expect(page).toHaveURL(/.*\/auth\/login\?message=.*/);
    await expect(page.getByText('Your session has expired due to inactivity')).toBeVisible();
  });
}); 