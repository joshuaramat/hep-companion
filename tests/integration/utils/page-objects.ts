import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object with common functionality
 */
export class BasePage {
  readonly notificationLocator: Locator;
  
  constructor(protected page: Page) {
    this.notificationLocator = page.locator('[data-testid="notification"]');
  }
  
  /**
   * Wait for view to be loaded and visible
   */
  async waitForView(viewName: string, options = { timeout: 5000 }) {
    await this.page.waitForFunction(
      (name) => document.getElementById('current-view')?.textContent === name, 
      viewName,
      { timeout: options.timeout }
    );
  }
  
  /**
   * Get current view name
   */
  async getCurrentView() {
    return await this.page.evaluate(() => document.getElementById('current-view')?.textContent || '');
  }
  
  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    return await this.page.evaluate(() => window.appState.isAuthenticated);
  }
  
  /**
   * Get current user info
   */
  async getCurrentUser() {
    return await this.page.evaluate(() => window.appState.currentUser);
  }
  
  /**
   * Wait for notification to appear with specific text
   */
  async waitForNotification(message: string, options = { timeout: 5000 }) {
    await this.page.waitForFunction(
      (text) => {
        const notifications = Array.from(document.querySelectorAll('[data-testid="notification"]'));
        return notifications.some(n => n?.textContent?.includes(text) || false);
      },
      message,
      { timeout: options.timeout }
    );
  }
  
  /**
   * Get all notifications currently visible
   */
  async getNotifications() {
    return await this.page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-testid="notification"]'))
        .map(n => n?.textContent || '');
    });
  }
  
  /**
   * Logout from the application
   */
  async logout() {
    await this.page.evaluate(() => window.appState.logout());
    await this.waitForView('login');
  }
}

/**
 * Login Page Object
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly loginForm: Locator;
  
  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.submitButton = page.locator('[data-testid="login-button"]');
    this.errorMessage = page.locator('[data-testid="login-error"]');
    this.loginForm = page.locator('[data-testid="login-form"]');
  }
  
  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.evaluate(() => window.appState.navigate('login'));
    await this.waitForView('login');
    await this.loginForm.waitFor({ state: 'visible' });
  }
  
  /**
   * Login with credentials
   */
  async login(email: string, password: string) {
    // Navigate to login if not already there
    const currentView = await this.getCurrentView();
    if (currentView !== 'login') {
      await this.goto();
    }
    
    // Fill login form
    await this.emailInput.waitFor({ state: 'visible' });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    
    // Wait for authentication to complete or for error message
    await this.page.waitForFunction(() => {
      return window.appState.isAuthenticated === true || 
        (document.querySelector('[data-testid="login-error"]') as HTMLElement)?.style.display === 'block';
    });
  }
  
  /**
   * Get error message if present
   */
  async getErrorMessage() {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }
  
  /**
   * Check if login form is visible
   */
  async isLoginFormVisible() {
    return await this.loginForm.isVisible();
  }
}

/**
 * Dashboard Page Object
 */
export class DashboardPage extends BasePage {
  readonly welcomeMessage: Locator;
  readonly generateButton: Locator;
  readonly organizationButton: Locator;
  readonly historyButton: Locator;
  readonly currentOrganization: Locator;
  
  constructor(page: Page) {
    super(page);
    this.welcomeMessage = page.locator('h2:has-text("Welcome back")');
    this.generateButton = page.locator('[data-testid="generate-button"]');
    this.organizationButton = page.locator('[data-testid="organization-button"]');
    this.historyButton = page.locator('[data-testid="history-button"]');
    this.currentOrganization = page.locator('[data-testid="current-organization"]');
  }
  
  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.page.evaluate(() => window.appState.navigate('dashboard'));
    await this.waitForView('dashboard');
    await this.generateButton.waitFor({ state: 'visible' });
  }
  
  /**
   * Navigate to generate exercises page
   */
  async goToGenerateExercises() {
    await this.generateButton.click();
    await this.waitForView('generate');
  }
  
  /**
   * Navigate to organizations page
   */
  async goToOrganizations() {
    await this.organizationButton.click();
    await this.waitForView('organizations');
  }
  
  /**
   * Navigate to history page
   */
  async goToHistory() {
    await this.historyButton.click();
    await this.waitForView('history');
  }
  
  /**
   * Get current organization name
   */
  async getCurrentOrganization() {
    return await this.currentOrganization.textContent();
  }
}

/**
 * Generate Page Object
 */
export class GeneratePage extends BasePage {
  readonly promptTextarea: Locator;
  readonly generateButton: Locator;
  readonly patientMrnInput: Locator;
  readonly mrnInput: Locator;
  readonly clinicIdInput: Locator;
  readonly errorMessage: Locator;
  readonly loadingState: Locator;
  readonly loadingIndicator: Locator;
  readonly exerciseSuggestions: Locator;
  readonly generateForm: Locator;
  
  constructor(page: Page) {
    super(page);
    this.promptTextarea = page.locator('[data-testid="prompt-textarea"]');
    this.generateButton = page.locator('[data-testid="generate-button"]');
    this.patientMrnInput = page.locator('[data-testid="mrn-input"]');
    this.mrnInput = this.patientMrnInput;
    this.clinicIdInput = page.locator('[data-testid="clinic-id-input"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.loadingState = page.locator('[data-testid="loading-state"]');
    this.loadingIndicator = this.loadingState;
    this.exerciseSuggestions = page.locator('[data-testid="exercise-suggestions"]');
    this.generateForm = page.locator('[data-testid="generate-form"]');
  }
  
  /**
   * Navigate to generate page
   */
  async goto() {
    await this.page.evaluate(() => window.appState.navigate('generate'));
    await this.waitForView('generate');
    await this.generateForm.waitFor({ state: 'visible' });
  }
  
  /**
   * Fill prompt text
   */
  async fillPrompt(prompt: string) {
    await this.promptTextarea.waitFor({ state: 'visible' });
    await this.promptTextarea.fill(prompt);
  }
  
  /**
   * Fill patient MRN field
   */
  async fillPatientMRN(mrn: string) {
    await this.patientMrnInput.waitFor({ state: 'visible' });
    await this.patientMrnInput.fill(mrn);
  }
  
  /**
   * Fill patient information fields
   */
  async fillPatientInfo(mrn?: string, clinicId?: string) {
    if (mrn) {
      await this.fillPatientMRN(mrn);
    }
    if (clinicId) {
      await this.clinicIdInput.waitFor({ state: 'visible' });
      await this.clinicIdInput.fill(clinicId);
    }
  }
  
  /**
   * Submit generate form
   */
  async submitForm() {
    await this.generateButton.click();
  }
  
  /**
   * Complete flow to generate exercises
   */
  async generateExercises(prompt: string, mrn?: string, clinicId?: string) {
    await this.fillPrompt(prompt);
    await this.fillPatientInfo(mrn, clinicId);
    await this.submitForm();
    
    // Wait for either loading to complete or error to show
    if (prompt.length >= 20 && this._containsClinicalTerminology(prompt)) {
      await this.loadingState.waitFor({ state: 'visible' });
      await this.page.waitForTimeout(500); // Wait for loading animation to be visible
      await this.exerciseSuggestions.waitFor({ state: 'visible', timeout: 10000 });
    } else {
      await this.errorMessage.waitFor({ state: 'visible' });
    }
  }
  
  /**
   * Get number of generated exercises
   */
  async getExerciseCount() {
    const exerciseItems = this.page.locator('[data-testid="exercise-item"]');
    return await exerciseItems.count();
  }
  
  /**
   * Check if error is displayed
   */
  async hasError() {
    return await this.errorMessage.isVisible();
  }
  
  /**
   * Get error message text
   */
  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
  
  /**
   * Helper method to check if text contains clinical terminology
   */
  private _containsClinicalTerminology(text: string): boolean {
    const clinicalTerms = [
      'pain', 'patient', 'exercise', 'therapy', 'strength', 'mobility',
      'range of motion', 'rom', 'rehab', 'rehabilitation', 'physical therapy',
      'pt', 'injury', 'surgery', 'post-op', 'postoperative', 'chronic',
      'acute', 'diagnosis', 'condition', 'treatment', 'therapeutic'
    ];
    
    return clinicalTerms.some(term => text.toLowerCase().includes(term.toLowerCase()));
  }
}

/**
 * Exercise Suggestions Page Object
 */
export class ExerciseSuggestionsPage extends BasePage {
  readonly exerciseItems: Locator;
  readonly feedbackButton: Locator;
  readonly feedbackSuccess: Locator;
  
  constructor(page: Page) {
    super(page);
    this.exerciseItems = page.locator('[data-testid="exercise-item"]');
    this.feedbackButton = page.locator('[data-testid="feedback-button"]');
    this.feedbackSuccess = page.locator('[data-testid="feedback-success"]');
  }
  
  /**
   * Get number of exercise items
   */
  async getExerciseCount() {
    return await this.exerciseItems.count();
  }
  
  /**
   * Get exercise name by index
   */
  async getExerciseName(index = 0) {
    const exercises = await this.exerciseItems.all();
    if (exercises.length > index) {
      const nameElement = await exercises[index].locator('h3').first();
      return await nameElement.textContent();
    }
    return null;
  }
  
  /**
   * Apply rating to an exercise
   */
  async rateExercise(index: number, rating: 1 | 2 | 3 | 4 | 5) {
    const exercises = await this.exerciseItems.all();
    if (exercises.length > index) {
      const ratingButton = exercises[index].locator(`[data-testid="rating-${rating}"]`);
      await ratingButton.waitFor({ state: 'visible' });
      await ratingButton.click();
      
      // Wait for the comment box to appear
      await exercises[index].locator('[data-testid="comment-box"]').waitFor({ state: 'visible' });
    }
  }
  
  /**
   * Add comment to an exercise
   */
  async addComment(index: number, comment: string) {
    const exercises = await this.exerciseItems.all();
    if (exercises.length > index) {
      const commentBox = exercises[index].locator('[data-testid="comment-box"]');
      await commentBox.waitFor({ state: 'visible' });
      await commentBox.fill(comment);
    }
  }
  
  /**
   * View research evidence for an exercise
   */
  async viewResearchEvidence(index: number) {
    const exercises = await this.exerciseItems.all();
    if (exercises.length > index) {
      const evidenceButton = exercises[index].locator('[data-testid="evidence-button"]');
      await evidenceButton.waitFor({ state: 'visible' });
      await evidenceButton.click();
      
      // Wait for evidence panel to be visible
      await exercises[index].locator('[data-testid="research-evidence"]').waitFor({ state: 'visible' });
    }
  }
  
  /**
   * Get evidence text from an exercise
   */
  async getResearchEvidence(index: number) {
    const exercises = await this.exerciseItems.all();
    if (exercises.length > index) {
      const evidencePanel = exercises[index].locator('[data-testid="research-evidence"]');
      if (await evidencePanel.isVisible()) {
        return await evidencePanel.textContent();
      } else {
        await this.viewResearchEvidence(index);
        return await evidencePanel.textContent();
      }
    }
    return null;
  }
  
  /**
   * Submit feedback for exercises
   */
  async submitFeedback() {
    await this.feedbackButton.waitFor({ state: 'visible' });
    await this.feedbackButton.click();
    
    try {
      // Wait for notification
      await this.waitForNotification('Feedback submitted', { timeout: 3000 });
      
      // Wait for success message
      await this.feedbackSuccess.waitFor({ state: 'visible', timeout: 5000 });
      
      // Wait for navigation to success page
      await this.waitForView('success', { timeout: 5000 });
    } catch (error) {
      // Check for error notification (if no ratings were submitted)
      const notifications = await this.getNotifications();
      if (notifications.some(n => n.includes('Please rate'))) {
        return false;
      }
      throw error;
    }
    
    return true;
  }
}

/**
 * Organization Page Object
 */
export class OrganizationPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly searchError: Locator;
  readonly organizationList: Locator;
  readonly organizationItems: Locator;
  readonly noResults: Locator;
  readonly organizationSelected: Locator;
  readonly currentOrganization: Locator;
  
  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.searchButton = page.locator('[data-testid="search-button"]');
    this.searchError = page.locator('[data-testid="search-error"]');
    this.organizationList = page.locator('[data-testid="organization-list"]');
    this.organizationItems = page.locator('[data-testid="organization-item"]');
    this.noResults = page.locator('[data-testid="no-results"]');
    this.organizationSelected = page.locator('[data-testid="organization-selected"]');
    this.currentOrganization = page.locator('[data-testid="current-organization"]');
  }
  
  /**
   * Navigate to organizations page
   */
  async goto() {
    await this.page.evaluate(() => window.appState.navigate('organizations'));
    await this.waitForView('organizations');
    await this.searchInput.waitFor({ state: 'visible' });
  }
  
  /**
   * Search for organizations
   */
  async searchOrganizations(query: string) {
    await this.searchInput.waitFor({ state: 'visible' });
    await this.searchInput.fill(query);
    await this.searchButton.click();
    
    // Wait for results, no results, or error
    await this.page.waitForFunction(() => {
      return (document.querySelector('[data-testid="organization-list"]') as HTMLElement)?.style.display === 'block' ||
        (document.querySelector('[data-testid="no-results"]') as HTMLElement)?.style.display === 'block' ||
        (document.querySelector('[data-testid="search-error"]') as HTMLElement)?.style.display === 'block';
    });
  }
  
  /**
   * Get count of organization items
   */
  async getOrganizationCount() {
    if (await this.organizationList.isVisible()) {
      return await this.organizationItems.count();
    }
    return 0;
  }
  
  /**
   * Get organization names
   */
  async getOrganizationNames() {
    if (await this.organizationList.isVisible()) {
      return await this.organizationItems.allTextContents();
    }
    return [];
  }
  
  /**
   * Select organization by index
   */
  async selectOrganization(index: number) {
    const items = await this.organizationItems.all();
    if (items.length > index) {
      await items[index].waitFor({ state: 'visible' });
      await items[index].click();
      
      // Wait for selection confirmation
      await this.organizationSelected.waitFor({ state: 'visible' });
      
      // Wait for notification
      await this.waitForNotification('Organization', { timeout: 3000 });
    }
  }
  
  /**
   * Check if error is displayed
   */
  async hasError() {
    return await this.searchError.isVisible();
  }
  
  /**
   * Check if no results message is displayed
   */
  async hasNoResults() {
    return await this.noResults.isVisible();
  }
  
  /**
   * Get selected organization text
   */
  async getSelectedOrganization() {
    if (await this.organizationSelected.isVisible()) {
      return await this.organizationSelected.textContent();
    }
    return null;
  }
  
  /**
   * Get organization state from application
   */
  async getSelectedOrganizationState() {
    return await this.page.evaluate(() => window.appState.selectedOrganization);
  }
}

/**
 * Success Page Object 
 */
export class SuccessPage extends BasePage {
  readonly newPromptButton: Locator;
  
  constructor(page: Page) {
    super(page);
    this.newPromptButton = page.locator('[data-testid="new-prompt-button"]');
  }
  
  /**
   * Navigate to success page
   */
  async goto() {
    await this.page.evaluate(() => window.appState.navigate('success'));
    await this.waitForView('success');
    await this.newPromptButton.waitFor({ state: 'visible' });
  }
  
  /**
   * Start a new prompt
   */
  async startNewPrompt() {
    await this.newPromptButton.waitFor({ state: 'visible' });
    await this.newPromptButton.click();
    await this.waitForView('generate');
  }
}

/**
 * History Page Object
 */
export class HistoryPage extends BasePage {
  readonly historyItems: Locator;
  readonly dateFilter: Locator;
  readonly viewDetailsButtons: Locator;
  
  constructor(page: Page) {
    super(page);
    this.historyItems = page.locator('[data-testid="history-item"]');
    this.dateFilter = page.locator('[data-testid="date-filter"]');
    this.viewDetailsButtons = page.locator('[data-testid="view-details-button"]');
  }
  
  /**
   * Navigate to history page
   */
  async goto() {
    await this.page.evaluate(() => window.appState.navigate('history'));
    await this.waitForView('history');
    await this.historyItems.first().waitFor({ state: 'visible' });
  }
  
  /**
   * Change date filter
   */
  async filterByDate(filter: 'all' | 'week' | 'month') {
    await this.dateFilter.waitFor({ state: 'visible' });
    await this.dateFilter.selectOption(filter);
    
    // Wait for notification about filter change
    await this.waitForNotification('Filter changed', { timeout: 3000 });
  }
  
  /**
   * Get count of history items
   */
  async getHistoryItemCount() {
    return await this.historyItems.count();
  }
  
  /**
   * View details of history item by index
   */
  async viewDetails(index: number) {
    const buttons = await this.viewDetailsButtons.all();
    if (buttons.length > index) {
      await buttons[index].click();
      
      // Wait for navigation to generate page
      await this.waitForView('generate');
    }
  }
} 