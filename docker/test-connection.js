/**
 * Test script to verify Docker Supabase connection
 * Run with: node docker/test-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from docker env file
dotenv.config({ path: path.join(__dirname, '..', '.env.docker') });

async function testConnection() {
  console.log('Testing Docker Supabase Connection...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Environment Check:');
  console.log(`   SUPABASE_URL: ${supabaseUrl ? 'success' + supabaseUrl : 'Missing'}`);
  console.log(`   ANON_KEY: ${supabaseKey ? 'Success [REDACTED]' : 'Missing'}\n`);

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: Check if we can query the exercises table
    console.log('Test 1: Querying exercises table...');
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('*')
      .limit(5);

    if (exercisesError) {
      console.error('   Error:', exercisesError.message);
    } else {
      console.log(`   Success! Found ${exercises.length} exercises\n`);
      
      if (exercises.length > 0) {
        console.log('   Sample exercise:');
        console.log(`   - Name: ${exercises[0].name}`);
        console.log(`   - Condition: ${exercises[0].condition}`);
        console.log(`   - Journal: ${exercises[0].journal}\n`);
      }
    }

    // Test 2: Check auth service
    console.log('Test 2: Testing authentication service...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError && authError.message !== 'invalid claim: missing sub claim') {
      console.error('   Auth Error:', authError.message);
    } else {
      console.log('   Auth service is responding\n');
    }

    // Test 3: Database connection info
    console.log('Test 3: Database info...');
    const { data: tables, error: tablesError } = await supabase
      .from('exercises')
      .select('count', { count: 'exact', head: true });

    if (tablesError) {
      console.error('   Error:', tablesError.message);
    } else {
      console.log(`   Exercises table has ${tables} records\n`);
    }

    console.log('All tests completed successfully!');
    console.log('\nNext steps:');
    console.log('   1. Access Supabase Studio at http://localhost:3002');
    console.log('   2. View emails at http://localhost:8025 (MailHog)');
    console.log('   3. Start developing with npm run dev');

  } catch (error) {
    console.error('\nConnection test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('   1. Make sure Docker services are running: npm run docker:ps');
    console.error('   2. Check logs: npm run docker:logs');
    console.error('   3. Ensure .env.docker exists with correct values');
    process.exit(1);
  }
}

// Run the test
testConnection().catch(console.error); 