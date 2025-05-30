import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(chalk.red('Missing environment variables:'));
  console.error(chalk.red('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗'));
  console.error(chalk.red('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗'));
  console.error(chalk.yellow('\nPlease ensure .env.local file exists with these variables'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Dynamic import for fetch
let fetch: any;

async function initializeFetch() {
  const nodeFetch = await import('node-fetch');
  fetch = nodeFetch.default;
}

console.log(chalk.blue('Testing Phase 3: AI Citation Integration\n'));

async function testGenerateAPI() {
  console.log(chalk.yellow('Test 1: Valid clinical scenario'));
  
  try {
    // First, sign in to get auth token
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });

    if (authError) {
      console.log(chalk.red('Authentication failed:'), authError.message);
      console.log(chalk.yellow('Creating test user...'));
      
      // Create test user if doesn't exist
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      if (signUpError) {
        throw signUpError;
      }
    }

    const session = authData?.session || (await supabase.auth.getSession()).data.session;
    
    if (!session) {
      throw new Error('No session available');
    }

    // Test valid request
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        prompt: 'Patient is a 45-year-old with chronic low back pain, experiencing pain with forward flexion. No radicular symptoms. Needs exercises for core strengthening and lumbar mobility.'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.ok !== false) {
      console.log(chalk.green('Valid request successful'));
      console.log(chalk.gray('Response structure:'));
      console.log(chalk.gray(`- ID: ${data.id || data.data?.id}`));
      console.log(chalk.gray(`- Exercises: ${data.exercises?.length || data.data?.exercises?.length} exercises`));
      console.log(chalk.gray(`- Clinical notes: ${data.clinical_notes ? 'Present' : data.data?.clinical_notes ? 'Present' : 'Missing'}`));
      console.log(chalk.gray(`- Citations: ${data.citations?.length || data.data?.citations?.length} citations`));
      console.log(chalk.gray(`- Confidence level: ${data.confidence_level || data.data?.confidence_level || 'Not specified'}`));
      
      // Check if exercises have evidence sources
      const exercises = data.exercises || data.data?.exercises || [];
      const hasEvidenceSources = exercises.every((ex: any) => ex.evidence_source);
      console.log(chalk.gray(`- All exercises have evidence sources: ${hasEvidenceSources ? 'Pass' : 'Fail'}`));
      
      if (exercises.length > 0) {
        console.log(chalk.gray('\nSample exercise:'));
        const sampleExercise = exercises[0];
        console.log(chalk.gray(JSON.stringify(sampleExercise, null, 2)));
      }
    } else {
      console.log(chalk.red('Unexpected response:'), data);
    }

  } catch (error) {
    console.log(chalk.red('Test failed:'), error);
  }
}

async function testValidationErrors() {
  console.log(chalk.yellow('\nTest 2: Testing validation errors'));
  
  try {
    const session = (await supabase.auth.getSession()).data.session;
    
    if (!session) {
      console.log(chalk.red('No session available, skipping validation tests'));
      return;
    }

    // Test with invalid prompt (too short)
    console.log(chalk.gray('Testing with short prompt...'));
    const response1 = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        prompt: 'back pain'
      })
    });

    const data1 = await response1.json();
    
    if (!response1.ok || data1.ok === false) {
      console.log(chalk.green('Short prompt correctly rejected'));
      console.log(chalk.gray(`- Message: ${data1.message || data1.error}`));
      console.log(chalk.gray(`- Code: ${data1.code || 'Not specified'}`));
    } else {
      console.log(chalk.red('Short prompt should have been rejected'));
    }

    // Test with non-clinical prompt
    console.log(chalk.gray('\nTesting with non-clinical prompt...'));
    const response2 = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        prompt: 'I want to get stronger and build muscle mass for bodybuilding competition'
      })
    });

    const data2 = await response2.json();
    
    if (!response2.ok || data2.ok === false) {
      console.log(chalk.green('Non-clinical prompt correctly rejected'));
      console.log(chalk.gray(`- Message: ${data2.message || data2.error}`));
      console.log(chalk.gray(`- Code: ${data2.code || 'Not specified'}`));
    } else {
      console.log(chalk.red('Non-clinical prompt should have been rejected'));
    }

  } catch (error) {
    console.log(chalk.red('Validation test failed:'), error);
  }
}

async function testExerciseLibraryIntegration() {
  console.log(chalk.yellow('\nTest 3: Exercise library integration'));
  
  try {
    // Check if exercises are in the database
    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('*')
      .limit(5);

    if (error) {
      console.log(chalk.red('Failed to fetch exercises:'), error.message);
      return;
    }

    console.log(chalk.green(`Found ${exercises?.length || 0} exercises in database`));
    
    if (exercises && exercises.length > 0) {
      console.log(chalk.gray('\nSample exercises from database:'));
      exercises.slice(0, 3).forEach((ex, i) => {
        console.log(chalk.gray(`${i + 1}. ${ex.name} (${ex.condition})`));
        console.log(chalk.gray(`   Evidence: ${ex.journal}, ${ex.year}`));
      });
    }

    // Test that generated exercises match database exercises
    const session = (await supabase.auth.getSession()).data.session;
    
    if (session) {
      console.log(chalk.gray('\nTesting if AI uses exercises from database...'));
      
      const response = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          prompt: 'Patient has acute ACL reconstruction, post-op week 8. Need exercises for quadriceps strengthening and knee stability.'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.ok !== false) {
        const generatedExercises = data.exercises || data.data?.exercises || [];
        console.log(chalk.green(`Generated ${generatedExercises.length} exercises for ACL condition`));
        
        // Check if any generated exercises match database exercises
        const exerciseNames = exercises.map(ex => ex.name.toLowerCase());
        const matchingExercises = generatedExercises.filter((ex: any) => 
          exerciseNames.some(name => ex.name.toLowerCase().includes(name) || name.includes(ex.name.toLowerCase()))
        );
        
        if (matchingExercises.length > 0) {
          console.log(chalk.green(`Found ${matchingExercises.length} exercises matching database`));
        } else {
          console.log(chalk.yellow('No exact matches found (AI may be paraphrasing)'));
        }
      }
    }

  } catch (error) {
    console.log(chalk.red('Exercise library test failed:'), error);
  }
}

async function testErrorResponseFormat() {
  console.log(chalk.yellow('\nTest 4: Error response format'));
  
  try {
    // Test without authentication
    console.log(chalk.gray('Testing unauthenticated request...'));
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Test prompt'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log(chalk.green('Unauthenticated request correctly rejected'));
      console.log(chalk.gray(`- Status: ${response.status}`));
      console.log(chalk.gray(`- Has 'ok' field: ${Object.hasOwn(data, 'ok') ? 'Yes' : 'No'}`));
      console.log(chalk.gray(`- Has 'message' field: ${Object.hasOwn(data, 'message') ? 'Yes' : 'No'}`));
      console.log(chalk.gray(`- Has 'error' field: ${Object.hasOwn(data, 'error') ? 'Yes' : 'No'}`));
      
      if (data.ok === false && data.message) {
        console.log(chalk.green('Error response follows expected format { ok: false, message }'));
      }
    }

  } catch (error) {
    console.log(chalk.red('Error format test failed:'), error);
  }
}

async function runAllTests() {
  console.log(chalk.blue('Starting Phase 3 tests...\n'));
  
  // Initialize fetch
  await initializeFetch();
  
  // Check if API is running
  try {
    console.log(chalk.gray('Checking API server...'));
    const healthCheck = await fetch('http://localhost:3000/api/generate', {
      method: 'GET'
    });
    
    // 405 Method Not Allowed is expected for GET request
    if (healthCheck.status !== 405 && healthCheck.status !== 200) {
      console.log(chalk.red(`Unexpected API status: ${healthCheck.status}`));
      process.exit(1);
    }
    
    console.log(chalk.green('✓ API server is running\n'));
  } catch (error: any) {
    console.log(chalk.red('Cannot connect to API server:'), error.message);
    console.log(chalk.yellow('Please start the development server with: npm run dev'));
    process.exit(1);
  }

  await testGenerateAPI();
  await testValidationErrors();
  await testExerciseLibraryIntegration();
  await testErrorResponseFormat();
  
  console.log(chalk.blue('\nTesting complete!'));
  
  // Sign out
  await supabase.auth.signOut();
}

// Run tests
runAllTests().catch(console.error).finally(() => process.exit(0)); 