import { NextRequest, NextResponse } from 'next/server';
import { getExercises, createExercise, getExerciseCountByCondition } from '@/services/supabase/exercises';
import { ExerciseFilters, ExerciseInsert } from '@/types/exercise';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filters from query parameters
    const filters: ExerciseFilters = {};
    
    const condition = searchParams.get('condition');
    if (condition && ['LBP', 'ACL', 'PFP'].includes(condition)) {
      filters.condition = condition as 'LBP' | 'ACL' | 'PFP';
    }
    
    const year = searchParams.get('year');
    if (year) {
      filters.year = parseInt(year, 10);
    }
    
    const journal = searchParams.get('journal');
    if (journal) {
      filters.journal = journal;
    }
    
    const searchTerm = searchParams.get('search');
    if (searchTerm) {
      filters.searchTerm = searchTerm;
    }
    
    // Check if requesting counts
    const getCounts = searchParams.get('counts') === 'true';
    
    if (getCounts) {
      const counts = await getExerciseCountByCondition();
      return NextResponse.json({ counts });
    }
    
    const exercises = await getExercises(filters);
    
    return NextResponse.json({
      exercises,
      total: exercises.length,
      filters: filters
    });
    
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['condition', 'name', 'description', 'journal', 'year'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Validate condition
    if (!['LBP', 'ACL', 'PFP'].includes(body.condition)) {
      return NextResponse.json(
        { error: 'Invalid condition. Must be LBP, ACL, or PFP' },
        { status: 400 }
      );
    }
    
    // Validate year
    if (typeof body.year !== 'number' || body.year < 1950) {
      return NextResponse.json(
        { error: 'Invalid year. Must be a number >= 1950' },
        { status: 400 }
      );
    }
    
    const exerciseData: ExerciseInsert = {
      condition: body.condition,
      name: body.name,
      description: body.description,
      journal: body.journal,
      year: body.year,
      doi: body.doi || null,
    };
    
    const newExercise = await createExercise(exerciseData);
    
    return NextResponse.json({
      exercise: newExercise,
      message: 'Exercise created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating exercise:', error);
    
    // Handle specific database validation errors
    if (error instanceof Error) {
      if (error.message.includes('Exercise must have journal citation')) {
        return NextResponse.json(
          { error: 'Journal citation is required' },
          { status: 400 }
        );
      }
      if (error.message.includes('Exercise must have valid publication year')) {
        return NextResponse.json(
          { error: 'Valid publication year is required (>= 1950)' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    );
  }
} 