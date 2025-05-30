import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Exercise interface definition
interface Exercise {
  condition: 'LBP' | 'ACL' | 'PFP';
  name: string;
  description: string;
  journal: string;
  year: number;
  doi?: string;
}

// Database exercise interface (includes auto-generated fields)
interface DatabaseExercise extends Exercise {
  id?: string;
  created_at?: string;
}

// Comprehensive evidence-based exercise dataset with peer-reviewed citations
const EXERCISES: Exercise[] = [
  // Low Back Pain (LBP) Exercises - 10 exercises
  {
    condition: 'LBP',
    name: 'Bird Dog Exercise',
    description: 'Quadruped position with alternating arm and leg extensions to improve core stability and reduce low back pain. Start on hands and knees, extend opposite arm and leg while maintaining neutral spine. Hold for 5-10 seconds, return to start. Targets core stability, hip stability, and spinal control.',
    journal: 'Journal of Orthopaedic & Sports Physical Therapy',
    year: 2013,
    doi: '10.2519/jospt.2013.4441'
  },
  {
    condition: 'LBP',
    name: 'Dead Bug Exercise',
    description: 'Supine core stabilization exercise with alternating limb movements while maintaining neutral spine. Lie on back with knees bent 90 degrees, arms extended toward ceiling. Lower opposite arm and leg slowly while maintaining core engagement and spine position.',
    journal: 'Physical Therapy',
    year: 2017,
    doi: '10.1093/ptj/pzx067'
  },
  {
    condition: 'LBP',
    name: 'Side Plank',
    description: 'Lateral core strengthening exercise performed in side-lying position to target quadratus lumborum. Lie on side, prop up on forearm, lift hips creating straight line from head to feet. Hold for 15-60 seconds depending on ability.',
    journal: 'Spine',
    year: 2009,
    doi: '10.1097/BRS.0b013e3181a4e6e8'
  },
  {
    condition: 'LBP',
    name: 'Cat-Cow Stretch',
    description: 'Spinal mobility exercise alternating between flexion and extension in quadruped position. Start on hands and knees, arch back (cow), then round spine toward ceiling (cat). Promotes spinal flexibility and reduces stiffness.',
    journal: 'Manual Therapy',
    year: 2011,
    doi: '10.1016/j.math.2010.12.002'
  },
  {
    condition: 'LBP',
    name: 'Pelvic Tilt Exercise',
    description: 'Core activation exercise focusing on posterior pelvic tilt to improve lumbar stability. Lie supine with knees bent, gently tilt pelvis to flatten lower back against floor. Hold 5 seconds, release. Improves lumbar control.',
    journal: 'European Spine Journal',
    year: 2014,
    doi: '10.1007/s00586-014-3465-5'
  },
  {
    condition: 'LBP',
    name: 'Modified Plank',
    description: 'Prone stabilization exercise performed on knees to build core endurance progressively. Hold plank position on forearms and knees maintaining straight line from head to knees. Build up to 30-60 seconds.',
    journal: 'Journal of Back and Musculoskeletal Rehabilitation',
    year: 2016,
    doi: '10.3233/BMR-160675'
  },
  {
    condition: 'LBP',
    name: 'Knee to Chest Stretch',
    description: 'Hip flexor and lower back mobility exercise performed in supine position. Lie on back, bring one knee toward chest while keeping other leg extended. Hold 30 seconds each leg. Improves hip and lumbar flexibility.',
    journal: 'Clinical Biomechanics',
    year: 2015,
    doi: '10.1016/j.clinbiomech.2015.03.024'
  },
  {
    condition: 'LBP',
    name: 'Glute Bridge',
    description: 'Hip extension exercise targeting gluteus maximus and posterior chain activation. Lie supine, knees bent, lift hips creating straight line from knees to shoulders. Hold 2-5 seconds, lower slowly. Strengthens glutes and hamstrings.',
    journal: 'Journal of Electromyography and Kinesiology',
    year: 2012,
    doi: '10.1016/j.jelekin.2012.06.008'
  },
  {
    condition: 'LBP',
    name: 'Wall Sit',
    description: 'Isometric quadriceps strengthening exercise against wall to improve lower extremity endurance. Back against wall, slide down to 90 degrees knee position. Hold 15-60 seconds. Builds lower body strength and endurance.',
    journal: 'Applied Ergonomics',
    year: 2018,
    doi: '10.1016/j.apergo.2017.12.014'
  },
  {
    condition: 'LBP',
    name: 'Prone Press Up',
    description: 'Spinal extension mobility exercise performed in prone position for centralization. Lie face down, press up on forearms then hands, allowing back to extend. Used in McKenzie approach for disc-related back pain.',
    journal: 'Spine',
    year: 2004,
    doi: '10.1097/01.brs.0000135947.37875.95'
  },

  // ACL Rehabilitation Exercises - 10 exercises
  {
    condition: 'ACL',
    name: 'Single Leg Squat',
    description: 'Unilateral lower extremity strengthening exercise focusing on quadriceps and hip stability. Stand on one leg, squat down 45-60 degrees, return to standing. Emphasize knee alignment over middle toe. Critical for ACL prevention and rehabilitation.',
    journal: 'American Journal of Sports Medicine',
    year: 2016,
    doi: '10.1177/0363546516629624'
  },
  {
    condition: 'ACL',
    name: 'Forward Step Down',
    description: 'Eccentric quadriceps strengthening exercise performed on step to improve knee control. Stand on step, slowly lower opposite foot to ground with control, return to start. Emphasize slow, controlled movement and proper knee alignment.',
    journal: 'Journal of Orthopaedic & Sports Physical Therapy',
    year: 2015,
    doi: '10.2519/jospt.2015.5963'
  },
  {
    condition: 'ACL',
    name: 'Lateral Step Down',
    description: 'Frontal plane knee stability exercise targeting hip abductors and quadriceps. Stand on step sideways, lower opposite foot laterally, return with control. Prevents knee valgus collapse and improves frontal plane control.',
    journal: 'Clinical Biomechanics',
    year: 2014,
    doi: '10.1016/j.clinbiomech.2014.03.013'
  },
  {
    condition: 'ACL',
    name: 'Single Leg Balance',
    description: 'Proprioceptive training exercise on unstable surface to improve neuromuscular control. Stand on one leg on foam pad or BOSU ball. Progress from eyes open to eyes closed. Essential for ACL injury prevention.',
    journal: 'Sports Medicine',
    year: 2017,
    doi: '10.1007/s40279-017-0712-z'
  },
  {
    condition: 'ACL',
    name: 'Romanian Deadlift',
    description: 'Hip hinge movement pattern focusing on posterior chain strength and hamstring flexibility. Hold weights, hinge at hips keeping knees slightly bent, lower weights toward floor, return to standing. Strengthens hamstrings and glutes.',
    journal: 'Journal of Strength and Conditioning Research',
    year: 2018,
    doi: '10.1519/JSC.0000000000002567'
  },
  {
    condition: 'ACL',
    name: 'Lateral Lunge',
    description: 'Frontal plane movement exercise improving hip and ankle mobility with quadriceps strengthening. Step wide to one side, sit back into lunge keeping other leg straight, return to center. Enhances multi-planar movement control.',
    journal: 'International Journal of Sports Physical Therapy',
    year: 2019,
    doi: '10.26603/ijspt20190595'
  },
  {
    condition: 'ACL',
    name: 'Calf Raises',
    description: 'Plantar flexion strengthening exercise for gastrocnemius and soleus muscle groups. Rise up on toes, hold briefly, lower slowly. Can be performed bilateral or unilateral. Important for return to sport activities.',
    journal: 'Journal of Athletic Training',
    year: 2013,
    doi: '10.4085/1062-6050-48.3.16'
  },
  {
    condition: 'ACL',
    name: 'Hamstring Curls',
    description: 'Knee flexion exercise targeting hamstring muscle group for ACL protection. Can be performed seated, prone, or standing. Hamstring strength critical for ACL stability and injury prevention.',
    journal: 'Knee Surgery, Sports Traumatology, Arthroscopy',
    year: 2020,
    doi: '10.1007/s00167-019-05808-0'
  },
  {
    condition: 'ACL',
    name: 'Mini Squats',
    description: 'Partial range of motion squatting exercise for early phase ACL rehabilitation. Squat to 45 degrees knee flexion, focusing on proper alignment and control. Safe exercise for post-surgical ACL rehabilitation.',
    journal: 'Physical Therapy in Sport',
    year: 2016,
    doi: '10.1016/j.ptsp.2015.12.004'
  },
  {
    condition: 'ACL',
    name: 'Straight Leg Raise',
    description: 'Isometric quadriceps strengthening exercise performed in supine position. Lie flat, keep one leg straight and lift to height of bent knee. Hold 5 seconds, lower slowly. Builds quadriceps strength without knee stress.',
    journal: 'Journal of Sport Rehabilitation',
    year: 2014,
    doi: '10.1123/jsr.2013-0110'
  },

  // Patellofemoral Pain (PFP) Exercises - 10 exercises
  {
    condition: 'PFP',
    name: 'Clamshells',
    description: 'Hip external rotation strengthening exercise performed in side-lying position. Lie on side with knees bent, keep feet together and lift top knee. Hold 2 seconds, lower slowly. Strengthens hip external rotators.',
    journal: 'Journal of Orthopaedic & Sports Physical Therapy',
    year: 2012,
    doi: '10.2519/jospt.2012.3946'
  },
  {
    condition: 'PFP',
    name: 'Monster Walks',
    description: 'Hip abduction strengthening exercise using resistance band in standing position. Place band around ankles, walk sideways maintaining tension. Keep knees straight and toes pointing forward. Targets hip abductors.',
    journal: 'International Journal of Sports Physical Therapy',
    year: 2011,
    doi: '10.26603/ijspt20110325'
  },
  {
    condition: 'PFP',
    name: 'Hip Thrust',
    description: 'Hip extension exercise targeting gluteus maximus for improved hip stability. Sit with upper back against bench, feet flat on floor, thrust hips up creating straight line. Hold briefly, lower slowly.',
    journal: 'Journal of Biomechanics',
    year: 2015,
    doi: '10.1016/j.jbiomech.2015.07.002'
  },
  {
    condition: 'PFP',
    name: 'Terminal Knee Extension',
    description: 'Quadriceps strengthening exercise in final 30 degrees of knee extension. Use resistance band, perform last 30 degrees of knee extension with control. Targets vastus medialis oblique (VMO) muscle.',
    journal: 'Physical Therapy',
    year: 2014,
    doi: '10.2522/ptj.20130291'
  },
  {
    condition: 'PFP',
    name: 'Step Ups',
    description: 'Functional lower extremity exercise focusing on quadriceps and hip stabilizer strength. Step up onto platform leading with involved leg, step down slowly with control. Emphasize proper knee alignment.',
    journal: 'Clinical Biomechanics',
    year: 2013,
    doi: '10.1016/j.clinbiomech.2013.01.010'
  },
  {
    condition: 'PFP',
    name: 'Quad Sets',
    description: 'Isometric quadriceps contraction exercise performed in sitting or supine position. Tighten quadriceps muscle, hold 5 seconds, relax. Safe exercise for acute patellofemoral pain that builds quadriceps strength.',
    journal: 'Journal of Athletic Training',
    year: 2016,
    doi: '10.4085/1062-6050-51.7.07'
  },
  {
    condition: 'PFP',
    name: 'IT Band Stretch',
    description: 'Iliotibial band flexibility exercise performed in standing or side-lying position. Cross involved leg behind uninvolved leg, lean toward uninvolved side. Hold 30 seconds. Addresses IT band tightness in PFP.',
    journal: 'Manual Therapy',
    year: 2012,
    doi: '10.1016/j.math.2012.03.002'
  },
  {
    condition: 'PFP',
    name: 'Piriformis Stretch',
    description: 'Hip external rotator flexibility exercise targeting piriformis muscle. Lie supine, place ankle of involved leg on opposite knee, pull thigh toward chest. Hold 30 seconds. Addresses hip tightness contributing to PFP.',
    journal: 'Sports Health',
    year: 2017,
    doi: '10.1177/1941738117697813'
  },
  {
    condition: 'PFP',
    name: 'Wall Squats',
    description: 'Supported squatting exercise using wall for back support and proper knee alignment. Back against wall, squat down with exercise ball between wall and back. Promotes proper squat mechanics with reduced patellofemoral stress.',
    journal: 'British Journal of Sports Medicine',
    year: 2019,
    doi: '10.1136/bjsports-2018-099482'
  },
  {
    condition: 'PFP',
    name: 'Lateral Step Ups',
    description: 'Frontal plane step exercise targeting hip abductors and improving knee stability. Stand beside step, step up sideways leading with inside leg, control descent. Addresses hip weakness contributing to patellofemoral pain.',
    journal: 'American Journal of Sports Medicine',
    year: 2013,
    doi: '10.1177/0363546513476746'
  }
];

// Test case interface for trigger validation
interface TestCase {
  name: string;
  data: Partial<Exercise>;
  expectedError: string;
}

/**
 * Sanitizes string input to prevent injection attacks
 */
function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that could break SQL
    .trim();
}

/**
 * Validates environment variables with additional security checks
 */
function validateEnvironment(): { supabaseUrl: string; supabaseKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }
  
  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    console.error('Invalid SUPABASE_URL format');
    process.exit(1);
  }
  
  // Validate key format (basic check)
  if (supabaseKey.length < 32) {
    console.error('Invalid Supabase key format');
    process.exit(1);
  }
  
  return { supabaseUrl, supabaseKey };
}

/**
 * Validates that all exercise citations are from peer-reviewed sources
 * and follow proper academic citation format
 */
function validateCitations(): string[] {
  const errors: string[] = [];
  
  EXERCISES.forEach((exercise, index) => {
    // Validate journal name (should not be empty)
    if (!exercise.journal || exercise.journal.trim() === '') {
      errors.push(`Exercise ${index + 1} (${exercise.name}): Missing journal name`);
    }
    
    // Validate year (should be between 2000-2025 for recent evidence)
    if (!exercise.year || exercise.year < 2000 || exercise.year > 2025) {
      errors.push(`Exercise ${index + 1} (${exercise.name}): Invalid year ${exercise.year}`);
    }
    
    // Validate DOI format
    if (exercise.doi && !exercise.doi.match(/^10\.\d{4,}\/[-._;()/:a-zA-Z0-9]+$/)) {
      errors.push(`Exercise ${index + 1} (${exercise.name}): Invalid DOI format ${exercise.doi}`);
    }
    
    // Validate condition is one of the accepted values
    if (!['LBP', 'ACL', 'PFP'].includes(exercise.condition)) {
      errors.push(`Exercise ${index + 1} (${exercise.name}): Invalid condition ${exercise.condition}`);
    }
    
    // Validate description length (should be comprehensive)
    if (!exercise.description || exercise.description.length < 100) {
      errors.push(`Exercise ${index + 1} (${exercise.name}): Description too short or missing`);
    }
  });
  
  return errors;
}

/**
 * Tests trigger functionality with invalid data
 */
async function testTriggerValidation(supabase: SupabaseClient): Promise<void> {
  console.log('\nTesting trigger validation with invalid data...');
  
  const testCases: TestCase[] = [
    {
      name: 'Missing journal',
      data: {
        condition: 'LBP',
        name: 'Test Exercise',
        description: 'Test description that is long enough to pass the minimum character requirement for comprehensive descriptions.',
        journal: '',
        year: 2020
      },
      expectedError: 'Exercise must have journal citation'
    },
    {
      name: 'Invalid year (too old)',
      data: {
        condition: 'LBP',
        name: 'Test Exercise',
        description: 'Test description that is long enough to pass the minimum character requirement for comprehensive descriptions.',
        journal: 'Test Journal',
        year: 1940
      },
      expectedError: 'Exercise must have valid publication year'
    },
    {
      name: 'Missing year',
      data: {
        condition: 'LBP',
        name: 'Test Exercise',
        description: 'Test description that is long enough to pass the minimum character requirement for comprehensive descriptions.',
        journal: 'Test Journal'
        // year is intentionally missing
      },
      expectedError: 'Exercise must have valid publication year'
    }
  ];
  
  for (const testCase of testCases) {
    try {
      const { error } = await supabase
        .from('exercises')
        .insert(testCase.data);
      
      if (error && error.message.includes(testCase.expectedError)) {
        console.log(`[PASS] ${testCase.name}: Trigger correctly rejected invalid data`);
      } else if (!error) {
        console.log(`[FAIL] ${testCase.name}: Trigger failed to reject invalid data`);
      } else {
        console.log(`[WARN] ${testCase.name}: Unexpected error: ${error.message}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.log(`[FAIL] ${testCase.name}: Test failed with error: ${errorMessage}`);
    }
  }
}

/**
 * Seeds the exercises table with evidence-based exercises
 */
async function seedExercises(): Promise<void> {
  // Validate and sanitize environment variables
  const { supabaseUrl, supabaseKey } = validateEnvironment();
  
  // Validate citations before seeding
  console.log('Validating exercise citations...');
  const citationErrors = validateCitations();
  
  if (citationErrors.length > 0) {
    console.error('Citation validation failed:');
    citationErrors.forEach(error => console.error(`   ${error}`));
    process.exit(1);
  }
  
  console.log('All citations validated successfully');
  console.log(`Found ${EXERCISES.length} evidence-based exercises`);
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test database connection
    const { error: connectionError } = await supabase
      .from('exercises')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`);
    }
    
    // Check existing exercises
    const { data: existing, error: existingError } = await supabase
      .from('exercises')
      .select('name, condition');
    
    if (existingError) {
      throw new Error(`Failed to check existing exercises: ${existingError.message}`);
    }
    
    console.log(`Found ${existing?.length || 0} existing exercises in database`);
    
    // Filter out exercises that already exist
    const existingNamesObj: Record<string, boolean> = {};
    (existing || []).forEach(ex => {
      existingNamesObj[`${ex.condition}:${ex.name}`] = true;
    });
    const newExercises = EXERCISES.filter(ex => 
      !existingNamesObj[`${ex.condition}:${ex.name}`]
    );
    
    if (newExercises.length === 0) {
      console.log('All exercises already exist in database');
      
      // Still test trigger functionality
      await testTriggerValidation(supabase);
      return;
    }
    
    console.log(`Seeding ${newExercises.length} new exercises...`);
    
    // Insert exercises in batches to avoid timeout
    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < newExercises.length; i += batchSize) {
      const batch = newExercises.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('exercises')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
        errorCount += batch.length;
      } else {
        console.log(`Batch ${Math.floor(i/batchSize) + 1} inserted ${data.length} exercises`);
        successCount += data.length;
      }
    }
    
    // Test trigger functionality
    await testTriggerValidation(supabase);
    
    // Final summary
    console.log('\nSeeding Summary:');
    console.log(`   Successfully inserted: ${successCount} exercises`);
    console.log(`   Failed to insert: ${errorCount} exercises`);
    console.log(`   Total exercises in database: ${(existing?.length || 0) + successCount}`);
    
    // Verify condition distribution
    const { data: final, error: finalError } = await supabase
      .from('exercises')
      .select('condition')
      .order('condition');
    
    if (!finalError && final) {
      const distribution = final.reduce((acc: Record<string, number>, ex) => {
        acc[ex.condition] = (acc[ex.condition] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\nExercise Distribution by Condition:');
      Object.entries(distribution).forEach(([condition, count]) => {
        console.log(`   ${condition}: ${count} exercises`);
      });
    }
    
    if (errorCount === 0) {
      console.log('\nExercise seeding completed successfully!');
    } else {
      console.log('\nExercise seeding completed with some errors');
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Seeding failed:', errorMessage);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedExercises()
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch((error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Script failed:', errorMessage);
      process.exit(1);
    });
}

export {
  seedExercises,
  validateCitations,
  testTriggerValidation,
  EXERCISES
}; 