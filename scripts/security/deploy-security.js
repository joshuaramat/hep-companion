#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}
╔══════════════════════════════════════════════════╗
║                                                  ║
║           HEP Companion Security Setup           ║
║                                                  ║
╚══════════════════════════════════════════════════╝
${colors.reset}`);

console.log(`${colors.yellow}This script will apply the security migrations to your Supabase database.${colors.reset}\n`);
console.log(`${colors.yellow}Ensure you have:${colors.reset}`);
console.log(`1. Access to your Supabase project`);
console.log(`2. Supabase CLI installed and configured`);
console.log(`3. Created a backup of your database`);
console.log(`\n${colors.red}WARNING: This will modify your database schema and enable RLS!${colors.reset}\n`);

// Function to execute a step with proper formatting
function executeStep(step, action) {
  console.log(`\n${colors.blue}[${step}]${colors.reset} ${action}...`);
}

// Function to execute a SQL file using Supabase CLI
function executeSqlFile(filePath, projectRef) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`${colors.red}Error: File not found: ${fullPath}${colors.reset}`);
      return false;
    }
    
    const command = projectRef 
      ? `supabase db push -f ${fullPath} --project-ref ${projectRef}` 
      : `supabase db push -f ${fullPath}`;
    
    console.log(`${colors.yellow}Executing: ${command}${colors.reset}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.log(`${colors.red}Error executing SQL file: ${error.message}${colors.reset}`);
    return false;
  }
}

// Function to verify the setup
async function verifySetup(projectRef) {
  executeStep('VERIFY', 'Checking if RLS is enabled');
  
  try {
    const command = projectRef 
      ? `supabase db dump --project-ref ${projectRef} -f ./temp-verify.sql`
      : `supabase db dump -f ./temp-verify.sql`;
    
    execSync(command, { stdio: 'inherit' });
    
    const dumpContent = fs.readFileSync('./temp-verify.sql', 'utf8');
    fs.unlinkSync('./temp-verify.sql');
    
    const rlsEnabled = dumpContent.includes('ENABLE ROW LEVEL SECURITY');
    const userIdColumnExists = dumpContent.includes('user_id uuid');
    const patientKeyColumnExists = dumpContent.includes('patient_key text');
    
    if (rlsEnabled && userIdColumnExists && patientKeyColumnExists) {
      console.log(`${colors.green}Verification successful! Security setup appears correct.${colors.reset}`);
    } else {
      console.log(`${colors.red}Verification issues:${colors.reset}`);
      if (!rlsEnabled) console.log(`${colors.red}- Row Level Security may not be enabled on all tables${colors.reset}`);
      if (!userIdColumnExists) console.log(`${colors.red}- user_id column may be missing from some tables${colors.reset}`);
      if (!patientKeyColumnExists) console.log(`${colors.red}- patient_key column may be missing${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}Error verifying setup: ${error.message}${colors.reset}`);
  }
}

// Main function to run the deployment
async function runDeployment() {
  rl.question(`${colors.yellow}Do you want to continue? (yes/no): ${colors.reset}`, async (answer) => {
    if (answer.toLowerCase() !== 'yes') {
      console.log(`${colors.red}Deployment cancelled.${colors.reset}`);
      rl.close();
      return;
    }
    
    rl.question(`${colors.yellow}Enter your Supabase project reference (leave blank for local): ${colors.reset}`, async (projectRef) => {
      console.log(`\n${colors.green}Starting deployment...${colors.reset}\n`);
      
      // Step 1: Apply schema changes
      executeStep('STEP 1/3', 'Applying schema changes');
      const schemaSuccess = executeSqlFile('./src/services/supabase/migrations/01_security_schema.sql', projectRef);
      
      if (!schemaSuccess) {
        console.log(`${colors.red}Failed to apply schema changes. Aborting.${colors.reset}`);
        rl.close();
        return;
      }
      
      // Step 2: Apply RLS policies
      executeStep('STEP 2/3', 'Applying RLS policies');
      const rlsSuccess = executeSqlFile('./src/services/supabase/migrations/02_rls_policies.sql', projectRef);
      
      if (!rlsSuccess) {
        console.log(`${colors.red}Failed to apply RLS policies. Aborting.${colors.reset}`);
        rl.close();
        return;
      }
      
      // Step 3: Verify the setup
      executeStep('STEP 3/3', 'Verifying setup');
      await verifySetup(projectRef);
      
      console.log(`\n${colors.green}Deployment completed! Here's what was done:${colors.reset}`);
      console.log(`1. Added user_id and patient_key columns to tables`);
      console.log(`2. Created audit_logs table and triggers`);
      console.log(`3. Set up 90-day purge job for audit logs`);
      console.log(`4. Enabled Row Level Security on all tables`);
      console.log(`5. Applied RLS policies to restrict data access`);
      
      console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
      console.log(`1. Update your application code to use the new security features`);
      console.log(`2. Test authentication and data access with different users`);
      console.log(`3. Verify audit logs are being created correctly`);
      
      rl.close();
    });
  });
}

runDeployment(); 