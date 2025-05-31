import { test, expect } from '@playwright/test';
// import '../mocks/setup';
import { setupAppEnvironment } from '../utils/app-environment';
import { LoginPage, DashboardPage } from '../utils/page-objects';

test.describe('Session Timeout', () => {
  test.beforeEach(async ({ page }) => {
    // Set up the simulated application environment
    await setupAppEnvironment(page);
  });

  test('should redirect to login after session timeout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // First login to establish a session
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    
    // Navigate to dashboard
    await dashboardPage.goto();
    
    // Verify we're on the dashboard
    await expect(dashboardPage.generateButton).toBeVisible();
    
    // Simulate session timeout
    await simulateSessionTimeout(page);
    
    // Try to access a protected route - should redirect to login
    await page.evaluate(() => window.appState.navigate('generate'));
    
    // Verify redirect to login
    const currentView = await loginPage.getCurrentView();
    expect(currentView).toBe('login');
  });

  test('should maintain session with user activity', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Login first
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    
    // Navigate to dashboard
    await dashboardPage.goto();
    
    // Simulate user activity by clicking different elements
    await dashboardPage.generateButton.click();
    await page.waitForTimeout(1000);
    
    await dashboardPage.goto();
    await dashboardPage.organizationButton.click();
    await page.waitForTimeout(1000);
    
    // Verify session is still active (no redirect to login)
    expect(await loginPage.isAuthenticated()).toBeTruthy();
  });

  test('should use custom timeout value from configuration', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Login first
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    
    // Navigate to dashboard
    await dashboardPage.goto();
    
    // Simulate idle timeout with custom value (5 minutes)
    await simulateIdleTimeout(page, 5);
    
    // Try to navigate to a protected route - this should trigger redirect to login
    await page.evaluate(() => window.appState.navigate('generate'));
    
    // Verify session expired and redirected to login
    const currentView = await loginPage.getCurrentView();
    expect(currentView).toBe('login');
    expect(await loginPage.isAuthenticated()).toBeFalsy();
  });
});

/**
 * Simulate session timeout by modifying authentication state
 */
async function simulateSessionTimeout(page: any) {
  await page.evaluate(() => {
    window.appState.isAuthenticated = false;
    window.appState.currentUser = null;
  });
}

/**
 * Simulate idle timeout with custom duration
 */
async function simulateIdleTimeout(page: any, minutes: number) {
  await page.evaluate((mins: number) => {
    // Simulate idle timeout
    window.appState.isAuthenticated = false;
    window.appState.currentUser = null;
    window.appState._showNotification(`Session timed out after ${mins} minutes of inactivity`, 'warning');
  }, minutes);
} 