# HEP Companion Integration Tests

This directory contains the integration tests for the HEP Companion application. These tests verify the interaction between components and complete user flows in isolated, reproducible test environments.

## Integration Testing Approach

Unlike traditional integration tests that require spinning up a full application server, these tests use a simulated application environment approach, which provides several advantages:

- **True Independence**: Tests don't depend on external services or a running application server
- **Consistent Results**: Tests run in a controlled environment that's identical on every machine
- **Fast Execution**: No waiting for application startup/teardown between test runs
- **Realistic User Flows**: Tests follow complete user journeys from start to finish

## Test Structure

### App Environment

The simulated app environment creates a realistic DOM structure with:

- **Page Structure**: Header, content area, and navigation elements
- **Shared State**: A centralized application state object for components to interact with
- **Event Handlers**: Realistic event handling to simulate user interactions
- **API Responses**: Simulated API responses to test data flow

### Page Objects

We use the Page Object pattern to make tests more maintainable:

- Each page or component has a corresponding Page Object class
- Page Objects encapsulate selectors and provide high-level interaction methods
- Tests interact with the application through these Page Objects

## Running Tests

### Run All Integration Tests

```bash
npm run test:integration
```

### Run Tests with UI Mode

```bash
npm run test:integration:ui
```

### Run Tests in Debug Mode

```bash
npm run test:integration:debug
```

### Run Specific Test Groups

```bash
# Authentication tests
npm run test:integration:auth

# Exercise generation tests
npm run test:integration:exercises

# Organization management tests
npm run test:integration:organizations
```

### Run a Specific Test Pattern

```bash
npm run test:integration -- --pattern="auth/login.spec.ts"
```

## Key User Flows

The integration tests cover these key user flows:

1. **Authentication & Onboarding Flow**
   - Login/logout
   - Error handling
   - Organization selection

2. **Exercise Generation Flow**
   - Generate exercises from clinical scenarios
   - View and rate exercises
   - Submit feedback

3. **Organization Management Flow**
   - Search for organizations
   - Select organizations
   - Use organization context in exercises

## Custom Tools

### Simulated App Environment

`app-environment.ts` - Creates a simulated application environment with:
- Realistic DOM structure
- Application state management
- Event handling
- Form validation

### Page Objects

`page-objects.ts` - Provides Page Object classes for:
- Login page
- Dashboard
- Exercise generation
- Organization management
- and more

## Best Practices

1. **Each test should be independent**
   - Tests should not depend on other tests
   - Use the page object's `goto()` methods to navigate to the starting point

2. **Test complete flows**
   - Integration tests should verify complete user journeys
   - Don't test individual functions in isolation (that's for unit tests)

3. **Use realistic test data**
   - Tests should use data that resembles real user input
   - Consider edge cases and validation scenarios 