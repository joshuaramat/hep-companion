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
  
  // Navigation and view management
  navigate(route: string): void;
  createView(route: string): void;
  setupEventHandlers(route: string): void;
  
  // User and session management
  toggleUserMenu(): void;
  logout(): void;
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