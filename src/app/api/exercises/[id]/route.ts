import { NextRequest, NextResponse } from 'next/server';
import { getExerciseById, updateExercise, deleteExercise } from '@/services/supabase/exercises';
import { ExerciseUpdate } from '@/types/exercise';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const exercise = await getExerciseById(params.id);
    return NextResponse.json({ exercise });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    
    if (error instanceof Error && error.message.includes('No rows returned')) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch exercise' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    
    // Validate condition if provided
    if (body.condition && !['LBP', 'ACL', 'PFP'].includes(body.condition)) {
      return NextResponse.json(
        { error: 'Invalid condition. Must be LBP, ACL, or PFP' },
        { status: 400 }
      );
    }
    
    // Validate year if provided
    if (body.year !== undefined && (typeof body.year !== 'number' || body.year < 1950)) {
      return NextResponse.json(
        { error: 'Invalid year. Must be a number >= 1950' },
        { status: 400 }
      );
    }
    
    const updateData: ExerciseUpdate = {};
    
    // Only include fields that are provided
    if (body.condition) updateData.condition = body.condition;
    if (body.name) updateData.name = body.name;
    if (body.description) updateData.description = body.description;
    if (body.journal) updateData.journal = body.journal;
    if (body.year) updateData.year = body.year;
    if (body.doi !== undefined) updateData.doi = body.doi;
    
    const updatedExercise = await updateExercise(params.id, updateData);
    
    return NextResponse.json({
      exercise: updatedExercise,
      message: 'Exercise updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating exercise:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No rows returned')) {
        return NextResponse.json(
          { error: 'Exercise not found' },
          { status: 404 }
        );
      }
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
      { error: 'Failed to update exercise' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await deleteExercise(params.id);
    
    return NextResponse.json({
      message: 'Exercise deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting exercise:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    );
  }
} 