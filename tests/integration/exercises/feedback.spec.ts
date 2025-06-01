import { test, expect } from '@playwright/test';
import { setupAppEnvironment } from '../utils/app-environment';
import { LoginPage, GeneratePage, ExerciseSuggestionsPage } from '../utils/page-objects';
// import '../mocks/setup';

test.describe('Exercise Feedback Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up the simulated application environment
    await setupAppEnvironment(page);
    
    // Login and generate exercises before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    
    // Generate exercises
    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    const clinicalScenario = 'Patient with chronic lower back pain, age 45, needs home exercises to improve core strength.';
    await generatePage.generateExercises(clinicalScenario);
  });
  
  test('should display exercise feedback interface', async ({ page }) => {
    // Verify suggestions page elements
    const suggestionsPage = new ExerciseSuggestionsPage(page);
    
    // Verify rating options are visible
    const exerciseCount = await suggestionsPage.getExerciseCount();
    expect(exerciseCount).toBeGreaterThan(0);
    
    // Check for rating options on first exercise
    await expect(page.locator('[data-testid="rating-options"]').first()).toBeVisible();
    
    // Check for submit feedback button
    await expect(suggestionsPage.feedbackButton).toBeVisible();
  });
  
  test('should allow rating individual exercises', async ({ page }) => {
    const suggestionsPage = new ExerciseSuggestionsPage(page);
    
    // Rate the first exercise with 5 stars
    await suggestionsPage.rateExercise(0, 5);
    
    // Verify rating is applied (by checking for selected state)
    await expect(page.locator('[data-testid="rating-5"]').first()).toHaveClass(/selected/);
    
    // Verify comment textarea appears
    await expect(page.locator('textarea').first()).toBeVisible();
  });
  
  test('should allow adding comments to rated exercises', async ({ page }) => {
    const suggestionsPage = new ExerciseSuggestionsPage(page);
    
    // Rate the first exercise
    await suggestionsPage.rateExercise(0, 4);
    
    // Add a comment
    const comment = 'This exercise is very helpful for lower back pain. Clear instructions.';
    await suggestionsPage.addComment(0, comment);
    
    // Verify comment is added - be specific about which textarea
    const exercises = await page.locator('[data-testid="exercise-item"]').all();
    if (exercises.length > 0) {
      const commentBox = exercises[0].locator('[data-testid="comment-box"]');
      await expect(commentBox).toHaveValue(comment);
    }
  });
  
  test('should show research evidence when requested', async ({ page }) => {
    const suggestionsPage = new ExerciseSuggestionsPage(page);
    
    // View research evidence for first exercise
    await suggestionsPage.viewResearchEvidence(0);
    
    // Verify evidence panel is shown
    await expect(page.locator('[data-testid="research-evidence"]').first()).toBeVisible();
    
    // Verify citation information is shown
    await expect(page.locator('[data-testid="research-evidence"]').first()).toContainText('Research');
  });
  
  test('should submit all feedback and show confirmation', async ({ page }) => {
    const suggestionsPage = new ExerciseSuggestionsPage(page);
    
    // Rate multiple exercises
    await suggestionsPage.rateExercise(0, 5);
    await suggestionsPage.addComment(0, 'Excellent exercise for core strength');
    
    if (await suggestionsPage.getExerciseCount() > 1) {
      await suggestionsPage.rateExercise(1, 3);
      await suggestionsPage.addComment(1, 'Moderate difficulty, good instructions');
    }
    
    // Submit all feedback
    await suggestionsPage.submitFeedback();
    
    // Wait for navigation to success page
    await page.waitForTimeout(1500); // Wait for submission and navigation
    
    // Verify we're on the success page
    const currentView = await page.evaluate(() => document.getElementById('current-view')?.textContent);
    expect(currentView).toBe('success');
    
    // Verify success message content
    await expect(page.getByText('Thanks for your feedback!')).toBeVisible();
  });
}); 