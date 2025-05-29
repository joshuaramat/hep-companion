import { test, expect } from '@playwright/test';
import { setupAppEnvironment } from '../utils/app-environment';
import { LoginPage, DashboardPage, OrganizationPage } from '../utils/page-objects';

test.describe('Authentication & Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up the simulated application environment
    await setupAppEnvironment(page);
  });

  test('should display login page with all required elements', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Verify login form components are visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    
    // Verify form has proper labels
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
  });
  
  test('should successfully login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Login with valid test credentials
    await loginPage.login('test@example.com', 'password123');
    
    // Verify authentication was successful
    const isAuthenticated = await loginPage.isAuthenticated();
    expect(isAuthenticated).toBeTruthy();
    
    // Verify redirect to dashboard
    const currentView = await loginPage.getCurrentView();
    expect(currentView).toBe('dashboard');
    
    // Verify dashboard elements are visible
    const dashboardPage = new DashboardPage(page);
    await expect(dashboardPage.welcomeMessage).toBeVisible();
    await expect(dashboardPage.generateButton).toBeVisible();
    await expect(dashboardPage.organizationButton).toBeVisible();
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Attempt to login with invalid credentials
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    // Verify error message is displayed
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Invalid login credentials');
    
    // Verify user is still on login page
    const currentView = await loginPage.getCurrentView();
    expect(currentView).toBe('login');
    
    // Verify user is not authenticated
    const isAuthenticated = await loginPage.isAuthenticated();
    expect(isAuthenticated).toBeFalsy();
  });
  
  test('should allow organization selection as part of onboarding', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const organizationPage = new OrganizationPage(page);
    
    // First login
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    
    // Navigate to organization page
    await dashboardPage.goToOrganizations();
    
    // Verify organization search elements are visible
    await expect(organizationPage.searchInput).toBeVisible();
    await expect(organizationPage.searchButton).toBeVisible();
    
    // Search for organizations
    await organizationPage.searchOrganizations('clinic');
    
    // Verify search results
    const orgCount = await organizationPage.getOrganizationCount();
    expect(orgCount).toBeGreaterThan(0);
    
    // Select the first organization
    await organizationPage.selectOrganization(0);
    
    // Verify organization was selected
    const selectedOrg = await organizationPage.getSelectedOrganization();
    expect(selectedOrg).toBeTruthy();
    
    // Verify organization state was updated
    const selectedOrgState = await organizationPage.getSelectedOrganizationState();
    expect(selectedOrgState).toBeTruthy();
    expect(selectedOrgState.id).toBeTruthy();
    expect(selectedOrgState.name).toBeTruthy();
    expect(selectedOrgState.clinic_id).toBeTruthy();
  });
  
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Attempt to navigate to dashboard without logging in
    await page.evaluate(() => window.appState.navigate('dashboard'));
    
    // Verify redirect to login page
    const currentView = await page.evaluate(() => document.getElementById('current-view')?.textContent);
    expect(currentView).toBe('login');
    
    // Verify notification about authentication requirement
    const loginPage = new LoginPage(page);
    const notifications = await loginPage.getNotifications();
    expect(notifications.some(n => n.includes('Please log in'))).toBeTruthy();
  });
  
  test('should maintain authentication state across page navigation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Login first
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    
    // Navigate to different pages
    await dashboardPage.goToGenerateExercises();
    expect(await loginPage.isAuthenticated()).toBeTruthy();
    
    await dashboardPage.goto();
    expect(await loginPage.isAuthenticated()).toBeTruthy();
    
    await dashboardPage.goToOrganizations();
    expect(await loginPage.isAuthenticated()).toBeTruthy();
  });
  
  test('should successfully log out', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // First login
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    
    // Then logout
    await loginPage.logout();
    
    // Verify user is logged out
    expect(await loginPage.isAuthenticated()).toBeFalsy();
    
    // Verify login page is displayed
    expect(await loginPage.isLoginFormVisible()).toBeTruthy();
    
    // Verify notification about logout
    const notifications = await loginPage.getNotifications();
    expect(notifications.some(n => n.includes('logged out'))).toBeTruthy();
  });
}); 