import { test, expect } from '@playwright/test';
import { setupAppEnvironment } from '../utils/app-environment';
import { LoginPage, DashboardPage, GeneratePage, ExerciseSuggestionsPage, SuccessPage } from '../utils/page-objects';

test.describe('Exercise Generation Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up the simulated application environment
    await setupAppEnvironment(page);
    
    // Login first for all tests
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
  });

  test('should display generate form with all required elements', async ({ page }) => {
    // Navigate to generate page
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goToGenerateExercises();
    
    // Check that we're on the generate page
    const generatePage = new GeneratePage(page);
    const currentView = await generatePage.getCurrentView();
    expect(currentView).toBe('generate');
    
    // Verify form elements
    await expect(generatePage.promptTextarea).toBeVisible();
    await expect(generatePage.patientMrnInput).toBeVisible();
    await expect(generatePage.clinicIdInput).toBeVisible();
    await expect(generatePage.generateButton).toBeVisible();
  });

  test('should generate exercises from valid clinical scenario', async ({ page }) => {
    // Navigate to generate page
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goToGenerateExercises();
    
    const generatePage = new GeneratePage(page);
    
    // Enter clinical scenario
    const clinicalScenario = 'Patient with chronic lower back pain, age 45, needs home exercises to improve core strength and reduce pain. Has access to resistance bands but no other equipment.';
    await generatePage.generateExercises(clinicalScenario, '12345', 'CLINIC-1');
    
    // Verify exercise suggestions are displayed
    const suggestionsPage = new ExerciseSuggestionsPage(page);
    const exerciseCount = await suggestionsPage.getExerciseCount();
    expect(exerciseCount).toBeGreaterThan(0);
    
    // Verify first exercise has expected content
    const firstExerciseName = await suggestionsPage.getExerciseName(0);
    expect(firstExerciseName).toBeTruthy();
    expect(firstExerciseName).toContain('Core');
  });
  
  test('should show appropriate validation errors for form submissions', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    // Test 1: Too short prompt
    await generatePage.fillPrompt('Short prompt');
    await generatePage.submitForm();
    
    // Wait for and check error message about length
    await expect(generatePage.errorMessage).toBeVisible();
    await expect(generatePage.errorMessage).toContainText('at least 20 characters');
    
    // Navigate away and back to clear the form completely
    await page.evaluate(() => window.appState.navigate('dashboard'));
    await page.waitForTimeout(300);
    await generatePage.goto();
    
    // Test 2: Non-clinical prompt that's long enough
    // Carefully avoid any terms that might be considered clinical
    await generatePage.fillPrompt('I want to learn about baking chocolate cakes and decorating them with frosting and colorful sprinkles for birthday parties');
    await generatePage.submitForm();
    
    // Give validation time to process
    await page.waitForTimeout(1000);
    
    // Wait for and check error message about clinical validation
    await expect(generatePage.errorMessage).toBeVisible();
    await expect(generatePage.errorMessage).toContainText('clinical terminology');
  });

  test('should show loading state during generation', async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    // Enter valid clinical scenario
    const clinicalScenario = 'Patient with chronic lower back pain, age 45, needs home exercises.';
    await generatePage.fillPrompt(clinicalScenario);
    
    // Submit but capture loading state
    await generatePage.submitForm();
    
    // Verify loading state is shown
    await expect(generatePage.loadingState).toBeVisible();
  });
  
  test('should complete full exercise generation and feedback submission flow', async ({ page }) => {
    // Navigate to generate page
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goToGenerateExercises();
    
    const generatePage = new GeneratePage(page);
    const suggestionsPage = new ExerciseSuggestionsPage(page);
    
    // 1. Enter clinical scenario and generate exercises
    const clinicalScenario = 'Patient with shoulder mobility issues after rotator cuff surgery, cleared for gentle mobility exercises.';
    await generatePage.generateExercises(clinicalScenario);
    
    // 2. Verify exercises are generated
    const exerciseCount = await suggestionsPage.getExerciseCount();
    expect(exerciseCount).toBeGreaterThan(0);
    
    // 3. Rate the first exercise and add comment
    await suggestionsPage.rateExercise(0, 5);
    await suggestionsPage.addComment(0, 'Great exercise for this specific condition');
    
    // 4. Check evidence for the first exercise
    await suggestionsPage.viewResearchEvidence(0);
    const evidence = await suggestionsPage.getResearchEvidence(0);
    expect(evidence).toBeTruthy();
    expect(evidence).toContain('Research');
    
    // 5. Submit feedback
    const submissionSuccessful = await suggestionsPage.submitFeedback();
    expect(submissionSuccessful).toBeTruthy();
    
    // 6. Verify we're on the success page
    const successPage = new SuccessPage(page);
    const currentView = await successPage.getCurrentView();
    expect(currentView).toBe('success');
    
    // 7. Start a new prompt
    await successPage.startNewPrompt();
    
    // 8. Verify we're back on the generate page
    const finalView = await generatePage.getCurrentView();
    expect(finalView).toBe('generate');
  });
  
  test('should handle feedback submission validation', async ({ page }) => {
    // Navigate to generate page and generate exercises
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    
    const clinicalScenario = 'Patient with lower back pain needing core strengthening exercises.';
    await generatePage.generateExercises(clinicalScenario);
    
    const suggestionsPage = new ExerciseSuggestionsPage(page);
    
    // Try to submit feedback without rating any exercises
    await suggestionsPage.feedbackButton.click();
    
    // Should show a notification error about needing to rate exercises
    await suggestionsPage.waitForNotification('Please rate at least one exercise');
    
    // Verify we're still on the generate page with exercises visible
    const currentView = await suggestionsPage.getCurrentView();
    expect(currentView).toBe('generate');
    
    // Verify exercises are still visible
    const exerciseCount = await suggestionsPage.getExerciseCount();
    expect(exerciseCount).toBeGreaterThan(0);
    
    // Verify feedback success message is NOT shown
    await expect(suggestionsPage.feedbackSuccess).not.toBeVisible();
  });
}); 