export interface ExerciseSuggestion {
  id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  frequency: string;
  citations: Array<{
    title: string;
    authors: string;
    journal: string;
    year: string;
    doi?: string;
    url: string;
  }>;
}

export interface Feedback {
  prompt_id: string;
  suggestion_id: string;
  relevance_score: number;
  comment?: string;
}

export interface Prompt {
  id: string;
  prompt_text: string;
  created_at: string;
  raw_gpt_output: ExerciseSuggestion[];
  suggestions?: ExerciseSuggestion[];
}

export interface DatabasePrompt {
  id: string;
  prompt_text: string;
  created_at: string;
  raw_gpt_output: ExerciseSuggestion[];
  suggestions: ExerciseSuggestion[];
} 