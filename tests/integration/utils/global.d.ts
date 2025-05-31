/**
 * Type definitions for integration testing environment
 */

/**
 * Application state interface
 */
interface AppState {
  currentUser: {
    id: string;
    email: string;
    name?: string;
    permissions?: string[];
  } | null;
  isAuthenticated: boolean;
  selectedOrganization: {
    id: string;
    name: string;
    clinic_id: string;
  } | null;
  patientData: {
    mrn?: string;
    name?: string;
    age?: number;
    conditions?: string[];
  } | null;
  generatedExercises: Array<{
    id: string;
    name: string;
    description: string;
    instructions: string[];
    evidence?: string;
    contraindications?: string[];
  }> | null;
  feedback: Record<string, { 
    rating: number;
    comment: string;
    submitted: boolean;
  }>;
  currentPrompt?: string;
  
  // User profile data
  userProfile: {
    id: string | null;
    clinic_id: string | null;
    organization: string | null;
    full_name: string | null;
    profession: string | null;
  };
  
  // UI state
  showResults?: boolean;
  generatedResults?: any;
  
  // Navigation and view management
  navigate(route: string): void;
  createView(route: string): void;
  setupEventHandlers(route: string): void;
  
  // User and session management
  toggleUserMenu(): void;
  logout(): void;
  loadUserProfile(): Promise<void>;
  
  // Helper methods
  _showNotification(message: string, type?: string): void;
  _containsClinicalTerminology(text: string): boolean;
}

/**
 * Test authentication state
 */
interface TestAuthState {
  isAuthenticated: boolean;
  user: any;
  token: string | null;
}

/**
 * Extend Window interface for testing environment
 */
interface Window {
  appState: AppState;
  __TEST_AUTH_STATE__?: TestAuthState;
} 