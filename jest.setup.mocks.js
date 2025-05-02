/* global beforeEach, afterEach */

// Mock process.env to allow modification during tests
const originalEnv = process.env;

beforeEach(() => {
  // Create a mutable version of process.env for tests
  process.env = { ...originalEnv };
});

afterEach(() => {
  // Restore original process.env after each test
  process.env = originalEnv;
}); 