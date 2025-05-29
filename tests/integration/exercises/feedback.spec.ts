import { test, expect } from '@playwright/test';
import { loginUser } from '../utils/auth-helpers';
import { GeneratePage, ExerciseSuggestionsPage } from '../utils/page-objects';
import '../mocks/setup';

test.describe('Exercise Feedback Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and generate exercises before each test
    await loginUser(page);
    
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
    await expect(suggestionsPage.submitFeedbackButton).toBeVisible();
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
    
    // Verify comment is added
    const textarea = await page.locator('textarea').first();
    await expect(textarea).toHaveValue(comment);
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
    await suggestionsPage.submitAllFeedback();
    
    // Verify feedback success message
    await expect(page.locator('[data-testid="feedback-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-success"]')).toContainText('Thank you for your feedback');
  });
}); 