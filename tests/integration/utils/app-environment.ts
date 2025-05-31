// @ts-nocheck
import { Page } from '@playwright/test';

// Define the interface for AppState
interface AppState {
  currentUser: any;
  isAuthenticated: boolean;
  selectedOrganization: any;
  patientData: any;
  generatedExercises: any;
  feedback: Record<string, any>;
  currentPrompt?: string;
  navigate: (route: string) => void;
  _showNotification: (message: string, type?: string) => void;
  createView: (route: string) => void;
  setupEventHandlers: (route: string) => void;
  _containsClinicalTerminology: (text: string) => boolean;
  toggleUserMenu: () => void;
  logout: () => void;
}

// Extend Window interface to include appState
declare global {
  interface Window {
    appState: AppState;
  }
}

/**
 * Sets up a simulated application environment for integration testing
 * This creates a realistic DOM structure and app state management
 * that mirrors the real application without affecting production code
 */
export async function setupAppEnvironment(page: Page) {
  // Create a simulated application structure with header, content area, and navigation
  await page.setContent(`
    <div id="app">
      <header id="app-header">
        <nav id="main-nav">
          <div id="logo">HEP Companion</div>
          <div id="user-menu" data-testid="user-menu">User Menu</div>
          <div id="logout-button" data-testid="logout-button" style="display:none">Logout</div>
        </nav>
      </header>
      
      <main id="app-content">
        <!-- This will be populated by the current view -->
      </main>
      
      <div id="notifications" class="notification-container"></div>
      <div id="auth-status" style="display:none"></div>
      <div id="current-view">login</div>
    </div>
  `);
  
  // Set up the application state object that will be shared across tests
  await page.evaluate(() => {
    const w = window as any;
    w.appState = {
      currentUser: null,
      isAuthenticated: false,
      selectedOrganization: null,
      patientData: null,
      generatedExercises: null,
      feedback: {},
      
      /**
       * Simple routing simulation
       */
      navigate(route: string) {
        const contentEl = document.getElementById('app-content');
        const currentViewEl = document.getElementById('current-view');
        
        if (contentEl) contentEl.innerHTML = '';
        if (currentViewEl) currentViewEl.textContent = route;
        
        // Authentication checks - prevent unauthorized access
        if (!this.isAuthenticated && route !== 'login') {
          this._showNotification('Please log in to continue', 'error');
          this.navigate('login');
          return;
        }
        
        // Create view based on route
        this.createView(route);
      },
      
      /**
       * Show notification to user
       */
      _showNotification(message: string, type: string = 'info') {
        const container = document.getElementById('notifications');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.setAttribute('data-testid', 'notification');
        
        container.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
          notification.remove();
        }, 3000);
      },
      
      /**
       * Create DOM for specific views
       */
      createView(route) {
        const contentEl = document.getElementById('app-content');
        if (!contentEl) return;
        
        switch(route) {
          case 'login':
            contentEl.innerHTML = `
              <div class="auth-container">
                <h1>Sign in to your account</h1>
                <form id="login-form" data-testid="login-form">
                  <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" placeholder="Email" data-testid="email-input">
                  </div>
                  <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Password" data-testid="password-input">
                  </div>
                  <button type="submit" data-testid="login-button">Sign in</button>
                  <div id="login-error" class="error-message" style="display:none" data-testid="login-error"></div>
                </form>
              </div>
            `;
            break;
            
          case 'dashboard':
            contentEl.innerHTML = `
              <div class="dashboard-container">
                <h1>Dashboard</h1>
                <div class="user-welcome">
                  <h2>Welcome back, ${this.currentUser?.email || 'User'}</h2>
                </div>
                <div class="dashboard-actions">
                  <button id="generate-button" data-testid="generate-button">Generate Exercises</button>
                  <button id="organization-button" data-testid="organization-button">Manage Organization</button>
                  <button id="history-button" data-testid="history-button">View History</button>
                </div>
                <div class="organization-info">
                  <h3>Current Organization</h3>
                  <div data-testid="current-organization">${this.selectedOrganization?.name || 'No organization selected'}</div>
                </div>
              </div>
            `;
            break;
            
          case 'generate':
            contentEl.innerHTML = `
              <div class="generate-container">
                <h1>Generate Exercises</h1>
                <form id="generate-form" data-testid="generate-form">
                  <div class="form-group">
                    <label for="prompt">Clinical Scenario</label>
                    <textarea id="prompt" name="prompt" placeholder="Describe the patient's condition and exercise needs" data-testid="prompt-textarea"></textarea>
                  </div>
                  <div class="form-group">
                    <label for="mrn">Patient MRN</label>
                    <input id="mrn" name="mrn" placeholder="Patient MRN" data-testid="mrn-input">
                  </div>
                  <div class="form-group">
                    <label for="clinic_id">Clinic ID</label>
                    <input id="clinic_id" name="clinic_id" placeholder="Clinic ID" data-testid="clinic-id-input">
                  </div>
                  <button type="submit" data-testid="generate-button">Generate</button>
                  <div data-testid="error-message" class="error-message" style="display:none"></div>
                </div>
                <div data-testid="loading-state" class="loading-indicator" style="display:none">
                  <span>Generating exercises...</span>
                </div>
                <div data-testid="exercise-suggestions" class="exercise-suggestions" style="display:none"></div>
              </form>
            `;
            break;
            
          case 'organizations':
            contentEl.innerHTML = `
              <div class="organizations-container">
                <h1>Organizations</h1>
                <div class="organization-search" data-testid="organization-search">
                  <div class="form-group">
                    <label for="search-input">Search Organizations</label>
                    <input id="search-input" data-testid="search-input" placeholder="Search organizations">
                    <button data-testid="search-button" class="search-button">Search</button>
                  </div>
                  <div data-testid="search-error" class="error-message" style="display:none"></div>
                  <ul data-testid="organization-list" class="organization-list" style="display:none"></ul>
                  <div data-testid="no-results" class="no-results" style="display:none">No results found</div>
                  <div data-testid="organization-selected" class="organization-selected" style="display:none"></div>
                  <div data-testid="current-organization" class="current-organization" style="display:none">
                    ${this.selectedOrganization ? this.selectedOrganization.name : ''}
                  </div>
                </div>
              </div>
            `;
            break;
            
          case 'success':
            contentEl.innerHTML = `
              <div class="success-container">
                <div class="success-message">
                  <h1>Thanks for your feedback!</h1>
                  <p>Your input helps us improve the exercise suggestions for physical therapists.</p>
                  <button id="start-new-prompt-button" data-testid="new-prompt-button">
                    Start New Prompt
                  </button>
                </div>
              </div>
            `;
            break;
            
          case 'history':
            contentEl.innerHTML = `
              <div class="history-container">
                <h1>Exercise History</h1>
                <div class="history-filters">
                  <div class="form-group">
                    <label for="date-filter">Filter by Date</label>
                    <select id="date-filter" data-testid="date-filter">
                      <option value="all">All time</option>
                      <option value="week">Past week</option>
                      <option value="month">Past month</option>
                    </select>
                  </div>
                </div>
                <ul class="history-list" data-testid="history-list">
                  <li class="history-item" data-testid="history-item">
                    <div class="history-date">Yesterday</div>
                    <div class="history-prompt">Patient with chronic lower back pain</div>
                    <button class="view-details-button" data-testid="view-details-button">View Details</button>
                  </li>
                  <li class="history-item" data-testid="history-item">
                    <div class="history-date">Last Week</div>
                    <div class="history-prompt">Shoulder mobility exercises</div>
                    <button class="view-details-button" data-testid="view-details-button">View Details</button>
                  </li>
                </ul>
              </div>
            `;
            break;
        }
        
        // Set up event handlers based on the view
        this.setupEventHandlers(route);
      },
      
      /**
       * Set up event listeners for the current view
       */
      setupEventHandlers(route) {
        const contentEl = document.getElementById('app-content');
        if (!contentEl) return;
        
        const logout = document.getElementById('logout-button');
        if (logout) {
          logout.onclick = () => this.logout();
        }
        
        const userMenu = document.getElementById('user-menu');
        if (userMenu) {
          userMenu.onclick = () => this.toggleUserMenu();
        }
        
        switch(route) {
          case 'login':
            const loginForm = contentEl.querySelector('#login-form');
            loginForm?.addEventListener('submit', (e) => {
              e.preventDefault();
              const email = (loginForm.querySelector('input[name="email"]') as HTMLInputElement)?.value;
              const password = (loginForm.querySelector('input[name="password"]') as HTMLInputElement)?.value;
              
              // Simulate authentication
              if (email === 'test@example.com' && password === 'password123') {
                this.isAuthenticated = true;
                this.currentUser = { id: 'test-user-id', email };
                this._showNotification('Login successful', 'success');
                this.navigate('dashboard');
              } else {
                const errorEl = loginForm.querySelector('#login-error');
                if (errorEl) {
                  errorEl.textContent = 'Invalid login credentials';
                  errorEl.style.display = 'block';
                }
              }
            });
            break;
            
          case 'dashboard':
            const generateButton = contentEl.querySelector('#generate-button');
            generateButton?.addEventListener('click', () => {
              this.navigate('generate');
            });
            
            const orgButton = contentEl.querySelector('#organization-button');
            orgButton?.addEventListener('click', () => {
              this.navigate('organizations');
            });
            
            const historyButton = contentEl.querySelector('#history-button');
            historyButton?.addEventListener('click', () => {
              this.navigate('history');
            });
            break;
            
          case 'generate':
            const generateForm = contentEl.querySelector('#generate-form');
            generateForm?.addEventListener('submit', (e) => {
              e.preventDefault();
              
              const promptEl = generateForm.querySelector('textarea[name="prompt"]') as HTMLTextAreaElement;
              const mrnEl = generateForm.querySelector('input[name="mrn"]') as HTMLInputElement;
              const clinicIdEl = generateForm.querySelector('input[name="clinic_id"]') as HTMLInputElement;
              
              const prompt = promptEl?.value || '';
              const mrn = mrnEl?.value || '';
              const clinicId = clinicIdEl?.value || '';
              
              // Store the current prompt
              this.currentPrompt = prompt;
              
              // Store patient data if provided
              if (mrn) {
                this.patientData = {
                  ...this.patientData,
                  mrn
                };
              }
              
              // Validate the prompt
              if (prompt.length < 20) {
                const errorEl = contentEl.querySelector('[data-testid="error-message"]');
                if (errorEl) {
                  errorEl.textContent = 'Prompt must be at least 20 characters';
                  errorEl.style.display = 'block';
                  return;
                }
              }
              
              // Validate clinical terminology
              if (!this._containsClinicalTerminology(prompt)) {
                const errorEl = contentEl.querySelector('[data-testid="error-message"]');
                if (errorEl) {
                  errorEl.textContent = 'Please include clinical terminology or patient information';
                  errorEl.style.display = 'block';
                  return;
                }
              }
              
              // Clear any previous error
              const errorEl = contentEl.querySelector('[data-testid="error-message"]');
              if (errorEl) {
                errorEl.style.display = 'none';
              }
              
              // Show loading state
              const loadingEl = contentEl.querySelector('[data-testid="loading-state"]');
              if (loadingEl) {
                loadingEl.style.display = 'block';
              }
              
              // Simulate API call
              setTimeout(() => {
                // Hide loading
                if (loadingEl) {
                  loadingEl.style.display = 'none';
                }
                
                // Generate mock exercises
                this.generatedExercises = [
                  {
                    id: 'ex-1',
                    name: 'Core Strengthening with Resistance Band',
                    description: 'A gentle exercise to strengthen core muscles with minimal equipment.',
                    instructions: [
                      'Sit on a chair or at the edge of your bed',
                      'Place the resistance band around your back and hold each end with your hands',
                      'Engage your core by sitting up tall',
                      'Slowly push both arms forward against the resistance of the band',
                      'Hold for 3 seconds and return to starting position',
                      'Repeat 10 times, 2-3 sets daily'
                    ],
                    evidence: 'Research shows resistance band exercises improve core strength and reduce pain in patients with lower back issues.',
                    contraindications: ['Severe, acute back pain', 'Recent abdominal surgery']
                  },
                  {
                    id: 'ex-2',
                    name: 'Modified Bridging Exercise',
                    description: 'Helps strengthen lower back and glutes while lying down.',
                    instructions: [
                      'Lie on your back with knees bent and feet flat on the floor/bed',
                      'Tighten your abdominal muscles and buttocks',
                      'Slowly lift your hips off the floor/bed to create a straight line from shoulders to knees',
                      'Hold for 5 seconds while breathing normally',
                      'Slowly lower back down',
                      'Repeat 10 times, 2 sets daily'
                    ],
                    evidence: 'Clinical studies demonstrate bridging exercises reduce pain and improve function in patients with chronic back pain.',
                    contraindications: ['Severe neck pain', 'Uncontrolled hypertension'] 
                  }
                ];
                
                // Display exercises
                const suggestionsEl = contentEl.querySelector('[data-testid="exercise-suggestions"]');
                if (suggestionsEl) {
                  suggestionsEl.innerHTML = `
                    <h2>Exercise Suggestions</h2>
                    <ul class="exercise-list">
                      ${this.generatedExercises.map((ex, index) => `
                        <li data-testid="exercise-item" data-id="${ex.id}" class="exercise-item">
                          <h3>${ex.name}</h3>
                          <p>${ex.description}</p>
                          <div class="exercise-instructions">
                            <h4>Instructions:</h4>
                            <ol>
                              ${ex.instructions.map(instr => `<li>${instr}</li>`).join('')}
                            </ol>
                          </div>
                          
                          <div class="exercise-ratings" data-testid="rating-options">
                            <h4>Rate this exercise:</h4>
                            <div class="rating-buttons">
                              ${[1,2,3,4,5].map(rating => `
                                <button data-testid="rating-${rating}" class="rating-button">
                                  ${rating}★
                                </button>
                              `).join('')}
                            </div>
                          </div>
                          
                          <textarea data-testid="comment-box" class="comment-box" style="display:none" placeholder="Add your feedback..."></textarea>
                          
                          <div class="evidence-container">
                            <button data-testid="evidence-button" class="evidence-button">View Research Evidence</button>
                            <div data-testid="research-evidence" class="research-evidence" style="display:none">
                              <h4>Research Evidence</h4>
                              <p>${ex.evidence}</p>
                              <h5>Contraindications:</h5>
                              <ul>
                                ${ex.contraindications?.map(item => `<li>${item}</li>`).join('') || ''}
                              </ul>
                            </div>
                          </div>
                        </li>
                      `).join('')}
                    </ul>
                    <div class="feedback-actions">
                      <button data-testid="feedback-button" class="feedback-button">Submit Feedback</button>
                    </div>
                  `;
                  suggestionsEl.style.display = 'block';
                  
                  // Add event handlers for ratings
                  suggestionsEl.querySelectorAll('.rating-button').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                      const target = e.target as HTMLElement;
                      const exerciseItem = target.closest('[data-testid="exercise-item"]');
                      const exerciseId = exerciseItem?.getAttribute('data-id');
                      const ratingValue = parseInt(target.getAttribute('data-testid')?.replace('rating-', '') || '0');
                      
                      // Store rating in app state
                      if (exerciseId) {
                        this.feedback[exerciseId] = {
                          rating: ratingValue,
                          comment: '',
                          submitted: false
                        };
                      }
                      
                      // Show selected state
                      const ratingButtons = exerciseItem?.querySelectorAll('.rating-button');
                      ratingButtons?.forEach(b => {
                        b.classList.remove('selected');
                      });
                      target.classList.add('selected');
                      
                      // Show comment box
                      const commentBox = exerciseItem?.querySelector('[data-testid="comment-box"]');
                      if (commentBox) {
                        commentBox.style.display = 'block';
                      }
                    });
                  });
                  
                  // Add event handlers for evidence buttons
                  suggestionsEl.querySelectorAll('[data-testid="evidence-button"]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                      const target = e.target as HTMLElement;
                      const exerciseItem = target.closest('[data-testid="exercise-item"]');
                      const evidencePanel = exerciseItem?.querySelector('[data-testid="research-evidence"]');
                      
                      if (evidencePanel) {
                        evidencePanel.style.display = evidencePanel.style.display === 'none' ? 'block' : 'none';
                      }
                    });
                  });
                  
                  // Add event handler for feedback submission
                  const submitButton = suggestionsEl.querySelector('[data-testid="feedback-button"]');
                  submitButton?.addEventListener('click', () => {
                    // Check if any ratings were submitted
                    const hasRatings = Object.keys(this.feedback).length > 0;
                    if (!hasRatings) {
                      this._showNotification('Please rate at least one exercise before submitting', 'error');
                      return;
                    }
                    
                    // Collect comments from textarea
                    suggestionsEl.querySelectorAll('[data-testid="comment-box"]').forEach(commentBox => {
                      const exerciseItem = commentBox.closest('[data-testid="exercise-item"]');
                      const exerciseId = exerciseItem?.getAttribute('data-id');
                      
                      if (exerciseId && this.feedback[exerciseId]) {
                        this.feedback[exerciseId].comment = (commentBox as HTMLTextAreaElement).value;
                        this.feedback[exerciseId].submitted = true;
                      }
                    });
                    
                    // Show success message
                    suggestionsEl.innerHTML = `
                      <div data-testid="feedback-success" class="feedback-success">
                        <h2>Feedback Submitted</h2>
                        <p>Thank you for your feedback!</p>
                      </div>
                    `;
                    
                    this._showNotification('Feedback submitted successfully!', 'success');
                    
                    // Navigate to success page
                    setTimeout(() => {
                      this.navigate('success');
                    }, 1000);
                  });
                }
              }, 1500); // Longer delay to simulate real-world API latency
            });
            break;
            
          case 'organizations':
            const searchButton = contentEl.querySelector('[data-testid="search-button"]');
            searchButton?.addEventListener('click', () => {
              const searchInput = contentEl.querySelector('[data-testid="search-input"]') as HTMLInputElement;
              const query = searchInput?.value || '';
              
              // Validate search query
              if (query.length < 2) {
                const errorEl = contentEl.querySelector('[data-testid="search-error"]');
                if (errorEl) {
                  errorEl.textContent = 'Search query must be at least 2 characters';
                  errorEl.style.display = 'block';
                }
                return;
              }
              
              // Hide error if previously shown
              const errorEl = contentEl.querySelector('[data-testid="search-error"]');
              if (errorEl) {
                errorEl.style.display = 'none';
              }
              
              // Check for nonexistent organization
              if (query.includes('nonexistent')) {
                const noResultsEl = contentEl.querySelector('[data-testid="no-results"]');
                const listEl = contentEl.querySelector('[data-testid="organization-list"]');
                
                if (noResultsEl) noResultsEl.style.display = 'block';
                if (listEl) listEl.style.display = 'none';
                return;
              }
              
              // Show results
              const listEl = contentEl.querySelector('[data-testid="organization-list"]');
              const noResultsEl = contentEl.querySelector('[data-testid="no-results"]');
              
              if (noResultsEl) noResultsEl.style.display = 'none';
              
              if (listEl) {
                listEl.innerHTML = `
                  <li data-testid="organization-item" data-id="org-1">Test Clinic</li>
                  <li data-testid="organization-item" data-id="org-2">Research Hospital</li>
                  <li data-testid="organization-item" data-id="org-3">Physical Therapy Center</li>
                `;
                listEl.style.display = 'block';
                
                // Add click handlers for organization selection
                listEl.querySelectorAll('[data-testid="organization-item"]').forEach(item => {
                  item.addEventListener('click', () => {
                    const orgId = item.getAttribute('data-id');
                    const orgName = item.textContent;
                    
                    // Store selection
                    this.selectedOrganization = {
                      id: orgId,
                      name: orgName,
                      clinic_id: orgId === 'org-1' ? 'CLINIC-1' : (orgId === 'org-2' ? 'CLINIC-2' : 'CLINIC-3')
                    };
                    
                    // Show selection confirmation
                    const selectedEl = contentEl.querySelector('[data-testid="organization-selected"]');
                    const currentOrgEl = contentEl.querySelector('[data-testid="current-organization"]');
                    
                    if (selectedEl) {
                      selectedEl.textContent = orgName;
                      selectedEl.style.display = 'block';
                    }
                    
                    if (currentOrgEl) {
                      currentOrgEl.textContent = orgName;
                      currentOrgEl.style.display = 'block';
                    }
                    
                    this._showNotification(`Organization ${orgName} selected`, 'success');
                  });
                });
              }
            });
            break;
            
          case 'success':
            const newPromptButton = contentEl.querySelector('#start-new-prompt-button');
            newPromptButton?.addEventListener('click', () => {
              this.navigate('generate');
            });
            break;
            
          case 'history':
            const viewButtons = contentEl.querySelectorAll('[data-testid="view-details-button"]');
            viewButtons.forEach(button => {
              button.addEventListener('click', () => {
                // Navigate to a detailed view of the historical exercise
                this.navigate('generate');
              });
            });
            
            const dateFilter = contentEl.querySelector('[data-testid="date-filter"]') as HTMLSelectElement;
            dateFilter?.addEventListener('change', () => {
              // Would normally update the list based on selection
              this._showNotification(`Filter changed to: ${dateFilter.value}`, 'info');
            });
            break;
        }
      },
      
      /**
       * Helper method to check if a string contains clinical terminology
       */
      _containsClinicalTerminology(text) {
        const clinicalTerms = [
          'pain', 'patient', 'exercise', 'therapy', 'strength', 'mobility',
          'range of motion', 'rom', 'rehab', 'rehabilitation', 'physical therapy',
          'pt', 'injury', 'surgery', 'post-op', 'postoperative', 'chronic',
          'acute', 'diagnosis', 'condition', 'treatment', 'therapeutic',
          'musculoskeletal', 'orthopedic', 'neurological', 'protocol'
        ];
        
        return clinicalTerms.some(term => text.toLowerCase().includes(term.toLowerCase()));
      },
      
      /**
       * Toggle the user menu
       */
      toggleUserMenu() {
        const menuEl = document.getElementById('logout-button');
        if (menuEl) {
          menuEl.style.display = menuEl.style.display === 'none' ? 'block' : 'none';
        }
      },
      
      /**
       * Logout function
       */
      logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this._showNotification('You have been logged out', 'info');
        this.navigate('login');
      }
    };
    
    // Initialize the application with login view
    window.appState.navigate('login');
  });
  
  return page;
} 