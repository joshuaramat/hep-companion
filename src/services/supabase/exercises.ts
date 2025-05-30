import { createClient } from './client';
import { 
  Exercise, 
  ExerciseInsert, 
  ExerciseUpdate, 
  ExerciseFilters,
  ExerciseCondition 
} from '@/types/exercise';

/**
 * Get all exercises with optional filtering
 */
export async function getExercises(filters?: ExerciseFilters) {
  const supabase = createClient();
  
  let query = supabase
    .from('exercises')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.condition) {
    query = query.eq('condition', filters.condition);
  }
  
  if (filters?.year) {
    query = query.eq('year', filters.year);
  }
  
  if (filters?.journal) {
    query = query.ilike('journal', `%${filters.journal}%`);
  }
  
  if (filters?.searchTerm) {
    query = query.or(
      `name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch exercises: ${error.message}`);
  }

  return data as Exercise[];
}

/**
 * Get exercises by condition
 */
export async function getExercisesByCondition(condition: ExerciseCondition) {
  return getExercises({ condition });
}

/**
 * Get a single exercise by ID
 */
export async function getExerciseById(id: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch exercise: ${error.message}`);
  }

  return data as Exercise;
}

/**
 * Create a new exercise
 */
export async function createExercise(exercise: ExerciseInsert) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create exercise: ${error.message}`);
  }

  return data as Exercise;
}

/**
 * Update an existing exercise
 */
export async function updateExercise(id: string, updates: ExerciseUpdate) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('exercises')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update exercise: ${error.message}`);
  }

  return data as Exercise;
}

/**
 * Delete an exercise
 */
export async function deleteExercise(id: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete exercise: ${error.message}`);
  }
}

/**
 * Get exercise count by condition
 */
export async function getExerciseCountByCondition() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('exercises')
    .select('condition')
    .order('condition');

  if (error) {
    throw new Error(`Failed to fetch exercise counts: ${error.message}`);
  }

  // Count exercises by condition
  const counts = data.reduce((acc, exercise) => {
    acc[exercise.condition] = (acc[exercise.condition] || 0) + 1;
    return acc;
  }, {} as Record<ExerciseCondition, number>);

  return counts;
}

/**
 * Search exercises by name or description
 */
export async function searchExercises(searchTerm: string, condition?: ExerciseCondition) {
  return getExercises({ searchTerm, condition });
}

/**
 * Get recent exercises (added in the last 30 days)
 */
export async function getRecentExercises(limit: number = 10) {
  const supabase = createClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch recent exercises: ${error.message}`);
  }

  return data as Exercise[];
} 