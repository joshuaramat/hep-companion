#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Load .env if it exists
try {
  require('dotenv').config();
  console.log('.env file loaded (if it exists)');
} catch (error) {
  console.log('Error loading .env file:', error.message);
}

// Also load .env.local if it exists
try {
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envLocalConfig = require('dotenv').parse(fs.readFileSync(envLocalPath));
    for (const k in envLocalConfig) {
      process.env[k] = envLocalConfig[k];
    }
    console.log('.env.local file loaded');
  } else {
    console.log('.env.local file not found');
  }
} catch (error) {
  console.log('Error loading .env.local file:', error.message);
}

// Check for Supabase variables
console.log('\nChecking for Supabase environment variables:');
console.log('------------------------------------------');

// Check NEXT_PUBLIC_SUPABASE_URL
const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${hasUrl ? 'Found' : 'Missing'}`);
if (hasUrl) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  console.log(`  Value: ${url.substring(0, 8)}...${url.substring(url.length - 5)}`);
}

// Check SUPABASE_SERVICE_ROLE_KEY
const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${hasKey ? 'Found' : 'Missing'}`);
if (hasKey) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(`  Value: ${key.substring(0, 3)}...${key.substring(key.length - 3)}`);
}

// Look for other Supabase-related variables that might be misnamed
const supabaseVars = Object.keys(process.env)
  .filter(key => key.includes('SUPABASE') && 
    key !== 'NEXT_PUBLIC_SUPABASE_URL' && 
    key !== 'SUPABASE_SERVICE_ROLE_KEY');

if (supabaseVars.length > 0) {
  console.log('\nOther Supabase-related environment variables found:');
  supabaseVars.forEach(key => {
    console.log(`- ${key}`);
  });
}

// Check if Next.js version-specific env loading might be causing issues
try {
  const packageJson = require(path.resolve(process.cwd(), 'package.json'));
  const nextVersion = packageJson.dependencies.next;
  console.log(`\nNext.js version: ${nextVersion}`);
  console.log('Note: Next.js loads .env.local automatically for server-side code');
  console.log('but Node.js scripts need to load it explicitly (which this script does).');
} catch (error) {
  console.log('\nCould not determine Next.js version:', error.message);
}

// Check for env files
console.log('\nEnvironment files in project root:');
['.env', '.env.local', '.env.development', '.env.production'].forEach(file => {
  const exists = fs.existsSync(path.resolve(process.cwd(), file));
  console.log(`- ${file}: ${exists ? 'Found' : 'Not found'}`);
});

console.log('\nIf your variables are missing, make sure they are correctly defined in your .env.local file');
console.log('Format should be:\n');
console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co');
console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key'); 