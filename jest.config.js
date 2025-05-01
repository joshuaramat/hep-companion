/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // A list of paths to directories that Jest should use to search for files in
  roots: [
    "<rootDir>"
  ],

  // The test environment that will be used for testing
  testEnvironment: "jsdom",

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/__tests__/**/*.ts?(x)",
    "**/?(*.)+(spec|test).ts?(x)"
  ],

  // A map from regular expressions to paths to transformers
  transform: {
    // Use babel-jest to process JavaScript and TypeScript files
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  
  // Don't transform node_modules except for specific packages
  transformIgnorePatterns: [
    "/node_modules/(?!nanoid|next/dist|@babel/runtime/helpers/esm)"
  ],
  
  // Setup files after environment is set up
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Allow using ES modules in tests
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};

module.exports = config; 