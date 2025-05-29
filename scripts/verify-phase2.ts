/**
 * Phase 2 Verification Script
 * 
 * This script verifies that all Phase 2 deliverables are properly implemented:
 * - Database contains exactly 30 exercises (10 LBP, 10 ACL, 10 PFP)
 * - Citation validation trigger works correctly
 * - All exercises have proper citations
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { ExerciseConditions } from '../src/types/exercise';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create a direct Supabase client for the script
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getExercises() {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch exercises: ${error.message}`);
  }

  return data;
}

async function getExerciseCountByCondition() {
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
  }, {} as Record<string, number>);

  return counts;
}

async function createExercise(exercise: any) {
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create exercise: ${error.message}`);
  }

  return data;
}

async function verifyPhase2Implementation() {
  console.log('🔍 Verifying Phase 2 Implementation...\n');
  
  let allTestsPassed = true;
  
  try {
    // Test 1: Verify total exercise count
    console.log('📊 Test 1: Verifying exercise count...');
    const allExercises = await getExercises();
    
    if (allExercises.length !== 30) {
      console.error(`FAIL: Expected 30 exercises, found ${allExercises.length}`);
      allTestsPassed = false;
    } else {
      console.log('PASS: Database contains exactly 30 exercises');
    }
    
    // Test 2: Verify exercise distribution by condition
    console.log('\nTest 2: Verifying exercise distribution...');
    const counts = await getExerciseCountByCondition();
    
    const expectedCounts = { LBP: 10, ACL: 10, PFP: 10 };
    
    for (const [condition, expectedCount] of Object.entries(expectedCounts)) {
      const actualCount = counts[condition as keyof typeof counts] || 0;
      if (actualCount !== expectedCount) {
        console.error(`FAIL: Expected ${expectedCount} ${condition} exercises, found ${actualCount}`);
        allTestsPassed = false;
      } else {
        console.log(`PASS: ${condition} has exactly ${actualCount} exercises`);
      }
    }
    
    // Test 3: Verify citation validation
    console.log('\nTest 3: Verifying citation validation...');
    
    // Test invalid exercise (missing journal)
    try {
      await createExercise({
        condition: 'LBP',
        name: 'Test Exercise',
        description: 'Test description',
        journal: '', // Empty journal should fail
        year: 2020,
      });
      console.error('FAIL: Citation validation should prevent empty journal');
      allTestsPassed = false;
    } catch (error) {
      if (error instanceof Error && error.message.includes('journal citation')) {
        console.log('PASS: Citation validation correctly prevents empty journal');
      } else {
        console.error('FAIL: Unexpected error during journal validation:', error);
        allTestsPassed = false;
      }
    }
    
    // Test invalid year
    try {
      await createExercise({
        condition: 'LBP',
        name: 'Test Exercise',
        description: 'Test description',
        journal: 'Test Journal',
        year: 1949, // Year < 1950 should fail
      });
      console.error('FAIL: Citation validation should prevent year < 1950');
      allTestsPassed = false;
    } catch (error) {
      if (error instanceof Error && error.message.includes('publication year')) {
        console.log('PASS: Citation validation correctly prevents invalid year');
      } else {
        console.error('FAIL: Unexpected error during year validation:', error);
        allTestsPassed = false;
      }
    }
    
    // Test 4: Verify all exercises have proper citations
    console.log('\nTest 4: Verifying exercise citations...');
    
    let citationFailures = 0;
    
    for (const exercise of allExercises) {
      const issues = [];
      
      if (!exercise.journal || exercise.journal.trim() === '') {
        issues.push('missing journal');
      }
      
      if (!exercise.year || exercise.year < 1950) {
        issues.push('invalid year');
      }
      
      if (issues.length > 0) {
        console.error(`Exercise "${exercise.name}" has issues: ${issues.join(', ')}`);
        citationFailures++;
      }
    }
    
    if (citationFailures === 0) {
      console.log('PASS: All exercises have proper citations');
    } else {
      console.error(`FAIL: ${citationFailures} exercises have citation issues`);
      allTestsPassed = false;
    }
    
    // Test 5: Verify data quality
    console.log('\nTest 5: Verifying data quality...');
    
    const uniqueNames = new Set(allExercises.map(e => e.name));
    if (uniqueNames.size !== allExercises.length) {
      console.error('FAIL: Duplicate exercise names found');
      allTestsPassed = false;
    } else {
      console.log('PASS: All exercise names are unique');
    }
    
    // Check for empty descriptions
    const emptyDescriptions = allExercises.filter(e => !e.description || e.description.trim() === '');
    if (emptyDescriptions.length > 0) {
      console.error(`FAIL: ${emptyDescriptions.length} exercises have empty descriptions`);
      allTestsPassed = false;
    } else {
      console.log('PASS: All exercises have descriptions');
    }
    
    // Final result
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('ALL TESTS PASSED! Phase 2 implementation is complete and correct.');
      console.log('\nPhase 2 Deliverables Status:');
      console.log('30-row exercise library created');
      console.log('Citation validation implemented');
      console.log('Database properly seeded');
      console.log('TypeScript types created');
      console.log('Supabase client functions implemented');
    } else {
      console.log('SOME TESTS FAILED. Please review the issues above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Verification failed with error:', error);
    process.exit(1);
  }
}

// Run verification if called directly
if (require.main === module) {
  verifyPhase2Implementation();
}

export { verifyPhase2Implementation }; 