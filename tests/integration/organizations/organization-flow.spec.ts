import { test, expect } from '@playwright/test';
import { setupAppEnvironment } from '../utils/app-environment';
import { LoginPage, DashboardPage, OrganizationPage, GeneratePage } from '../utils/page-objects';

test.describe('Organization Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up the simulated application environment
    await setupAppEnvironment(page);
    
    // Login first for all tests
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
  });

  test('should navigate to organization page from dashboard', async ({ page }) => {
    // Start from dashboard
    const dashboardPage = new DashboardPage(page);
    
    // Navigate to organizations
    await dashboardPage.goToOrganizations();
    
    // Verify we landed on the correct page
    const currentView = await dashboardPage.getCurrentView();
    expect(currentView).toBe('organizations');
    
    // Verify organization page elements
    const organizationPage = new OrganizationPage(page);
    await expect(organizationPage.searchInput).toBeVisible();
    await expect(organizationPage.searchButton).toBeVisible();
  });

  test('should search for and find organizations', async ({ page }) => {
    // Go to organizations page
    const organizationPage = new OrganizationPage(page);
    await organizationPage.goto();
    
    // Search for organizations
    await organizationPage.searchOrganizations('clinic');
    
    // Verify results
    const orgCount = await organizationPage.getOrganizationCount();
    expect(orgCount).toBeGreaterThan(0);
    
    // Verify organization names returned
    const orgNames = await organizationPage.getOrganizationNames();
    expect(orgNames.length).toBeGreaterThan(0);
    expect(orgNames.some(name => name.includes('Clinic'))).toBeTruthy();
  });
  
  test('should handle search validation and error states', async ({ page }) => {
    const organizationPage = new OrganizationPage(page);
    await organizationPage.goto();
    
    // Test 1: Search with query that's too short
    await organizationPage.searchInput.fill('a');
    await organizationPage.searchButton.click();
    
    // Verify error message
    expect(await organizationPage.hasError()).toBeTruthy();
    
    // Test 2: Search for nonexistent organization
    await organizationPage.searchOrganizations('nonexistent');
    
    // Verify no results message
    expect(await organizationPage.hasNoResults()).toBeTruthy();
  });

  test('should select an organization and update application state', async ({ page }) => {
    const organizationPage = new OrganizationPage(page);
    await organizationPage.goto();
    
    // Search for organizations
    await organizationPage.searchOrganizations('clinic');
    
    // Select the first organization
    await organizationPage.selectOrganization(0);
    
    // Verify organization selection UI
    const selectedOrg = await organizationPage.getSelectedOrganization();
    expect(selectedOrg).toBeTruthy();
    
    // Verify organization state was updated
    const orgState = await organizationPage.getSelectedOrganizationState();
    expect(orgState).toBeTruthy();
    expect(orgState.id).toBeTruthy();
    expect(orgState.name).toBeTruthy();
    expect(orgState.clinic_id).toBeTruthy();
  });
  
  test('should persist selected organization across navigation', async ({ page }) => {
    const organizationPage = new OrganizationPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // First select an organization
    await organizationPage.goto();
    await organizationPage.searchOrganizations('clinic');
    await organizationPage.selectOrganization(0);
    
    // Store the selected organization info
    const selectedOrgState = await organizationPage.getSelectedOrganizationState();
    const selectedOrgName = selectedOrgState.name;
    
    // Navigate to dashboard
    await dashboardPage.goto();
    
    // Verify organization is still selected
    const dashboardOrgName = await dashboardPage.getCurrentOrganization();
    expect(dashboardOrgName).toContain(selectedOrgName);
    
    // Navigate back to organization page
    await dashboardPage.goToOrganizations();
    
    // Verify org is still selected
    const currentOrgState = await organizationPage.getSelectedOrganizationState();
    expect(currentOrgState.id).toBe(selectedOrgState.id);
    expect(currentOrgState.name).toBe(selectedOrgState.name);
  });
  
  test('should use organization context for exercise generation', async ({ page }) => {
    const organizationPage = new OrganizationPage(page);
    const dashboardPage = new DashboardPage(page);
    const generatePage = new GeneratePage(page);
    
    // First select an organization
    await organizationPage.goto();
    await organizationPage.searchOrganizations('clinic');
    await organizationPage.selectOrganization(0);
    
    // Get the clinic ID from the selected organization
    const orgState = await organizationPage.getSelectedOrganizationState();
    const clinicId = orgState.clinic_id;
    
    // Navigate to generate page
    await dashboardPage.goto();
    await dashboardPage.goToGenerateExercises();
    
    // Verify the clinic ID is pre-filled in the form
    const clinicInputValue = await generatePage.clinicIdInput.inputValue();
    expect(clinicInputValue).toBe(clinicId);
  });
}); 