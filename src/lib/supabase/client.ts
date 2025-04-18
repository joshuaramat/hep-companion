import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Helper function to insert citations for a suggestion
export async function insertCitations(suggestionId: string, citations: Array<{
  title: string;
  authors: string;
  journal: string;
  year: string;
  doi?: string;
  url: string;
}>) {
  const { data, error } = await supabase
    .from('citations')
    .insert(
      citations.map(citation => ({
        suggestion_id: suggestionId,
        ...citation
      }))
    )
    .select();

  if (error) {
    console.error('Error inserting citations:', error);
    throw error;
  }

  return data;
}

// Helper function to get citations for a suggestion
export async function getCitations(suggestionId: string) {
  const { data, error } = await supabase
    .from('citations')
    .select('*')
    .eq('suggestion_id', suggestionId);

  if (error) {
    console.error('Error fetching citations:', error);
    throw error;
  }

  return data;
} 