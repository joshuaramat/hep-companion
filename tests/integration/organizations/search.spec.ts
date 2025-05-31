import { test, expect } from '@playwright/test';
import { setupAppEnvironment } from '../utils/app-environment';
import { LoginPage, OrganizationPage, DashboardPage } from '../utils/page-objects';

test.describe('Organization Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up the simulated application environment
    await setupAppEnvironment(page);
    
    // Login first for all tests
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
  });
  
  test('should navigate to organization page', async ({ page }) => {
    const orgPage = new OrganizationPage(page);
    await orgPage.goto();
    
    // Verify page elements
    await expect(orgPage.searchInput).toBeVisible();
    await expect(orgPage.searchButton).toBeVisible();
  });
  
  test('should search for organizations', async ({ page }) => {
    const orgPage = new OrganizationPage(page);
    await orgPage.goto();
    
    // Search for organizations
    await orgPage.searchOrganizations('clinic');
    
    // Verify search results
    const count = await orgPage.getOrganizationCount();
    expect(count).toBeGreaterThan(0);
    
    // Verify organization names
    const orgNames = await orgPage.getOrganizationNames();
    expect(orgNames.some(name => name.includes('Clinic'))).toBeTruthy();
  });
  
  test('should select an organization and show confirmation', async ({ page }) => {
    const orgPage = new OrganizationPage(page);
    await orgPage.goto();
    
    // Search for organizations
    await orgPage.searchOrganizations('clinic');
    
    // Select the first organization
    await orgPage.selectOrganization(0);
    
    // Verify selection confirmation
    const selectedOrg = await orgPage.getSelectedOrganization();
    expect(selectedOrg).toBeTruthy();
  });
  
  test('should show no results message for non-existent organization', async ({ page }) => {
    const orgPage = new OrganizationPage(page);
    await orgPage.goto();
    
    // Search for non-existent organization
    await orgPage.searchOrganizations('nonexistent');
    
    // Wait for empty results message
    expect(await orgPage.hasNoResults()).toBeTruthy();
  });
  
  test('should require minimum search length', async ({ page }) => {
    const orgPage = new OrganizationPage(page);
    await orgPage.goto();
    
    // Try searching with too few characters
    await orgPage.searchInput.fill('a');
    await orgPage.searchButton.click();
    
    // Should show validation error
    expect(await orgPage.hasError()).toBeTruthy();
  });
  
  test('should persist selected organization across navigation', async ({ page }) => {
    const orgPage = new OrganizationPage(page);
    await orgPage.goto();
    
    // Search and select organization
    await orgPage.searchOrganizations('clinic');
    await orgPage.selectOrganization(0);
    
    // Store the selected organization info
    const selectedOrgState = await orgPage.getSelectedOrganizationState();
    expect(selectedOrgState).toBeTruthy();
    const selectedOrgName = selectedOrgState!.name;
    
    // Navigate to dashboard
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Navigate back to organizations
    await dashboardPage.goToOrganizations();
    
    // Verify org is still selected
    const currentOrgState = await orgPage.getSelectedOrganizationState();
    expect(currentOrgState?.id).toBe(selectedOrgState!.id);
    expect(currentOrgState?.name).toBe(selectedOrgState!.name);
  });
}); 