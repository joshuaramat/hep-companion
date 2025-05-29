#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}=== HEP Companion Integration Tests ===${colors.reset}\n`);
console.log(`${colors.yellow}Running with simulated application environment for true integration tests.${colors.reset}\n`);

// Parse command line arguments
const args = process.argv.slice(2);
let testPattern = '';
let uiMode = false;
let debugMode = false;

args.forEach(arg => {
  if (arg.startsWith('--pattern=')) {
    testPattern = arg.split('=')[1];
  } else if (arg === '--ui') {
    uiMode = true;
  } else if (arg === '--debug') {
    debugMode = true;
  }
});

// Build the playwright command
let command = 'npx playwright test';

if (testPattern) {
  // Special case for known test groups
  if (testPattern === 'auth/*.spec.ts') {
    command += ' tests/integration/auth/auth-flow.spec.ts tests/integration/auth/login.spec.ts tests/integration/auth/session-timeout.spec.ts';
  } else if (testPattern === 'exercises/*.spec.ts') {
    command += ' tests/integration/exercises/exercise-flow.spec.ts tests/integration/exercises/feedback.spec.ts tests/integration/exercises/generate.spec.ts';
  } else if (testPattern === 'organizations/*.spec.ts') {
    command += ' tests/integration/organizations/organization-flow.spec.ts tests/integration/organizations/search.spec.ts';
  } else {
    // For specific files
    command += ` tests/integration/${testPattern}`;
  }
} else {
  // Run all tests
  command += ' tests/integration';
}

if (uiMode) {
  command += ' --ui';
} else if (debugMode) {
  command += ' --debug';
} else {
  // Add reporters when not in UI or debug mode
  command += ' --reporter=html,list';
}

console.log(`${colors.yellow}Command: ${command}${colors.reset}\n`);

// Execute the tests
const testProcess = exec(command);

// Pipe process output to console
testProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

testProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle process completion
testProcess.on('close', (code) => {
  if (code === 0) {
    console.log(`\n${colors.green}${colors.bright}✓ Integration tests completed successfully!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bright}✗ Integration tests failed with code ${code}${colors.reset}`);
    console.log(`\n${colors.yellow}View the HTML report for details: npx playwright show-report${colors.reset}`);
  }
});

// Handle interruption
process.on('SIGINT', () => {
  testProcess.kill('SIGINT');
  console.log(`\n${colors.yellow}Tests interrupted.${colors.reset}`);
  process.exit(1);
}); 