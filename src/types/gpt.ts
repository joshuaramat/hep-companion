/**
 * Types for the GPT response structure
 */

export interface Citation {
  title: string;
  authors: string;
  journal: string;
  year: string | number;
  doi?: string;
  url?: string;
}

export interface ExerciseSuggestion {
  id?: string;
  exercise_name: string;
  sets: number;
  reps: number;
  frequency: string;
  citations: Citation[];
}

export interface GPTResponse {
  id?: string;
  suggestions: ExerciseSuggestion[];
} 