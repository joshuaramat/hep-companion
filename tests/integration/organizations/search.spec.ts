import { test, expect } from '@playwright/test';
import { loginUser } from '../utils/auth-helpers';
import { OrganizationPage } from '../utils/page-objects';
import '../mocks/setup';
import { testOrganizations } from '../mocks/handlers';

test.describe('Organization Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page);
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
    
    // Verify first organization name is visible
    await expect(page.locator('[data-testid="organization-list"] li').first())
      .toContainText(testOrganizations[0].name);
  });
  
  test('should select an organization and show confirmation', async ({ page }) => {
    const orgPage = new OrganizationPage(page);
    await orgPage.goto();
    
    // Search for organizations
    await orgPage.searchOrganizations('clinic');
    
    // Select the first organization
    await orgPage.selectOrganization(0);
    
    // Verify selection confirmation
    await expect(page.locator('[data-testid="organization-selected"]')).toBeVisible();
    await expect(page.locator('[data-testid="organization-selected"]'))
      .toContainText(testOrganizations[0].name);
  });
  
  test('should show no results message for non-existent organization', async ({ page }) => {
    const orgPage = new OrganizationPage(page);
    await orgPage.goto();
    
    // Search for non-existent organization
    await orgPage.searchInput.fill('nonexistentclinic12345');
    await orgPage.searchButton.click();
    
    // Wait for empty results message
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
  });
  
  test('should require minimum search length', async ({ page }) => {
    const orgPage = new OrganizationPage(page);
    await orgPage.goto();
    
    // Try searching with too few characters
    await orgPage.searchInput.fill('a');
    await orgPage.searchButton.click();
    
    // Should show validation error
    await expect(page.locator('[data-testid="search-error"]')).toBeVisible();
  });
  
  test('should persist selected organization across sessions', async ({ page }) => {
    const orgPage = new OrganizationPage(page);
    await orgPage.goto();
    
    // Search and select organization
    await orgPage.searchOrganizations('clinic');
    await orgPage.selectOrganization(0);
    
    // Navigate away
    await page.goto('/dashboard');
    
    // Navigate back to organizations
    await orgPage.goto();
    
    // Should show selected organization
    await expect(page.locator('[data-testid="current-organization"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-organization"]'))
      .toContainText(testOrganizations[0].name);
  });
}); 