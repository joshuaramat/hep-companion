#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Also load .env.local if it exists
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envLocalConfig = require('dotenv').parse(fs.readFileSync(envLocalPath));
  for (const k in envLocalConfig) {
    process.env[k] = envLocalConfig[k];
  }
}

// Generate a random-looking email
const generateEmail = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `test-${timestamp}-${random}@example.com`;
};

// Create a test user with confirmation bypassed
async function createTestUser(email, password = 'testpassword123') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: Supabase URL or service role key is missing');
    console.error('Make sure you have a .env or .env.local file with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.error('Current environment variables found:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
    process.exit(1);
  }

  // Create admin client with service role key for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Get the email from args or generate one
    const userEmail = email || generateEmail();
    
    console.log(`Creating test user with email: ${userEmail}`);
    
    // Create user with admin API (bypasses email verification)
    const { data, error } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: password,
      email_confirm: true // Auto-confirm the email
    });
    
    if (error) {
      console.error('Error creating user:', error.message);
      process.exit(1);
    }
    
    console.log('User created successfully!');
    console.log('------------------------');
    console.log('Email:', userEmail);
    console.log('Password:', password);
    console.log('User ID:', data.user.id);
    console.log('------------------------');
    console.log('You can now use these credentials to test the onboarding flow');
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0]; // Optional email argument
const password = args[1] || 'testpassword123'; // Optional password argument

// Run the function
createTestUser(email, password); 