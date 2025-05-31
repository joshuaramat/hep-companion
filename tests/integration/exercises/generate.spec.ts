import { test, expect } from '@playwright/test';
import { setupAppEnvironment } from '../utils/app-environment';
import { LoginPage, GeneratePage } from '../utils/page-objects';
// import '../mocks/setup';

test.describe('Exercise Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up the simulated application environment
    await setupAppEnvironment(page);
    
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
  });

  test('should navigate to generate page and display form', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    // Verify form elements are visible
    await expect(generatePage.promptTextarea).toBeVisible();
    await expect(generatePage.mrnInput).toBeVisible();
    await expect(generatePage.clinicIdInput).toBeVisible();
    await expect(generatePage.generateButton).toBeVisible();
  });

  test('should generate exercises from clinical scenario', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    const clinicalScenario = 'Patient with chronic lower back pain, age 45, needs home exercises to improve core strength.';
    await generatePage.generateExercises(clinicalScenario);
    
    // Verify exercises are generated
    await expect(generatePage.exerciseSuggestions).toBeVisible();
    const exerciseCount = await generatePage.getExerciseCount();
    expect(exerciseCount).toBeGreaterThan(0);
  });

  test('should handle patient identifiers correctly', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    // Fill in patient identifier
    await generatePage.fillPatientMRN('MRN-12345');
    
    const clinicalScenario = 'Patient with shoulder impingement needs mobility exercises.';
    await generatePage.generateExercises(clinicalScenario);
    
    // Verify exercises are generated with patient context
    await expect(generatePage.exerciseSuggestions).toBeVisible();
    
    // Verify MRN is preserved
    await expect(generatePage.mrnInput).toHaveValue('MRN-12345');
  });

  test('should show error for prompt that is too short', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    // Try to generate with a very short prompt
    await generatePage.fillPrompt('Short');
    await generatePage.generateButton.click();
    
    // Verify error message is shown
    await expect(generatePage.hasError()).resolves.toBeTruthy();
    await expect(generatePage.getErrorMessage()).resolves.toContain('20 characters');
  });

  test('should show error for non-clinical prompt', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    // Try to generate with non-clinical content that's long enough
    // Carefully avoid any terms that might be considered clinical
    const nonClinicalPrompt = 'I want to learn about baking chocolate cakes and making frosting. Also interested in gardening tips for growing tomatoes and flowers in my backyard during summer.';
    await generatePage.fillPrompt(nonClinicalPrompt);
    await generatePage.generateButton.click();
    
    // Wait for validation to process
    await page.waitForTimeout(500);
    
    // The error should be visible for non-clinical content
    await expect(generatePage.errorMessage).toBeVisible();
    await expect(generatePage.errorMessage).toContainText('clinical terminology');
  });

  test('should show loading state during generation', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    const clinicalScenario = 'Patient recovering from knee surgery needs progressive strengthening exercises.';
    
    // Start generation
    await generatePage.fillPrompt(clinicalScenario);
    await generatePage.generateButton.click();
    
    // Verify loading state appears
    await expect(generatePage.loadingIndicator).toBeVisible();
    
    // Wait for exercises to load
    await expect(generatePage.exerciseSuggestions).toBeVisible();
    
    // Verify loading state disappears
    await expect(generatePage.loadingIndicator).not.toBeVisible();
  });
}); 