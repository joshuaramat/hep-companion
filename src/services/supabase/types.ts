export interface Database {
  public: {
    Tables: {
      suggestions: {
        Row: {
          id: string;
          exercise_name: string;
          sets: number;
          reps: number;
          frequency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          exercise_name: string;
          sets: number;
          reps: number;
          frequency: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          exercise_name?: string;
          sets?: number;
          reps?: number;
          frequency?: string;
          created_at?: string;
        };
      };
      citations: {
        Row: {
          id: string;
          suggestion_id: string;
          title: string;
          authors: string;
          journal: string;
          year: string;
          doi: string | null;
          url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          suggestion_id: string;
          title: string;
          authors: string;
          journal: string;
          year: string;
          doi?: string | null;
          url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          suggestion_id?: string;
          title?: string;
          authors?: string;
          journal?: string;
          year?: string;
          doi?: string | null;
          url?: string;
          created_at?: string;
        };
      };
    };
  };
} 