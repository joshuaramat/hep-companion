import { test, expect } from '@playwright/test';
import { loginUser } from '../utils/auth-helpers';
import { GeneratePage, ExerciseSuggestionsPage } from '../utils/page-objects';
import '../mocks/setup';

test.describe('Exercise Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page);
  });
  
  test('should navigate to generate page and display form', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    // Verify form fields are visible
    await expect(generatePage.promptTextarea).toBeVisible();
    await expect(generatePage.generateButton).toBeVisible();
  });
  
  test('should generate exercises from clinical scenario', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    // Enter clinical scenario
    const clinicalScenario = 'Patient with chronic lower back pain, age 45, needs home exercises to improve core strength and reduce pain. Has access to resistance bands but no other equipment.';
    await generatePage.generateExercises(clinicalScenario);
    
    // Verify exercise suggestions are displayed
    const suggestionsPage = new ExerciseSuggestionsPage(page);
    const exerciseCount = await suggestionsPage.getExerciseCount();
    expect(exerciseCount).toBeGreaterThan(0);
    
    // Verify first exercise has content
    const firstExerciseName = await suggestionsPage.getExerciseName(0);
    expect(firstExerciseName).toBeTruthy();
  });
  
  test('should handle patient identifiers correctly', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    // Enter clinical scenario with patient identifiers
    const clinicalScenario = 'Patient needs shoulder mobility exercises after rotator cuff repair surgery.';
    await generatePage.generateExercises(clinicalScenario, '12345', 'CLINIC-1');
    
    // Verify exercise suggestions are displayed
    const suggestionsPage = new ExerciseSuggestionsPage(page);
    const exerciseCount = await suggestionsPage.getExerciseCount();
    expect(exerciseCount).toBeGreaterThan(0);
  });
  
  test('should show error for prompt that is too short', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    // Enter a prompt that's too short
    await generatePage.fillPrompt('Short prompt');
    await generatePage.submitForm();
    
    // Check for error message
    const hasError = await generatePage.hasError();
    expect(hasError).toBeTruthy();
    
    const errorMessage = await generatePage.getErrorMessage();
    expect(errorMessage).toContain('at least 20 characters');
  });
  
  test('should show error for non-clinical prompt', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    // Enter a non-clinical prompt that's long enough
    await generatePage.fillPrompt('This is a long enough prompt but contains no clinical terminology or patient information.');
    await generatePage.submitForm();
    
    // Check for error message about clinical validation
    const hasError = await generatePage.hasError();
    expect(hasError).toBeTruthy();
    
    const errorMessage = await generatePage.getErrorMessage();
    expect(errorMessage).toContain('clinical');
  });
  
  test('should show loading state during generation', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    // Enter valid clinical scenario
    await generatePage.fillPrompt('Patient with chronic lower back pain, age 45, needs home exercises to improve core strength and reduce pain.');
    
    // Submit but don't wait for completion
    await generatePage.submitForm();
    
    // Verify loading state is shown
    await expect(generatePage.loadingState).toBeVisible();
  });
}); 