import { PlaywrightTestConfig } from '@playwright/test';
import path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables from .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('Loading environment variables from .env.local');
  dotenv.config({ path: envLocalPath });
}

const config: PlaywrightTestConfig = {
  // Look for test files in the "tests" directory, relative to this configuration file
  testDir: './tests/integration',
  
  // Each test is given 30 seconds
  timeout: 30000,
  
  // Don't run tests in files in parallel
  fullyParallel: false,
  
  // Retry failed tests to handle flakiness
  retries: 1,
  
  // Reporter to use
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  
  // Global setup script
  globalSetup: path.join(__dirname, 'tests/integration/global-setup.ts'),
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        // Use chromium browser
        browserName: 'chromium',
        // Record traces for each test
        trace: 'on-first-retry',
        // Capture screenshots on failure
        screenshot: 'only-on-failure',
        // Record video on failure
        video: 'on-first-retry',
        // We're using a simulated app environment, no need for a real baseURL
      },
    },
  ],
  
  // Global test settings
  use: {
    // Maximum time each action (like click) is allowed to take
    actionTimeout: 10000,
    // Allow for longer navigation timeout
    navigationTimeout: 15000,
    // Context options
    contextOptions: {
      ignoreHTTPSErrors: true,
    },
    // Pass environment variables to browser context
    launchOptions: {
      env: {
        NODE_ENV: 'test',
      },
    },
  },
};

export default config; 