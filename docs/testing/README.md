# Testing Documentation

This directory contains all testing-related documentation, strategies, and reports for HEP Companion.

## Contents

### Testing Guides

- **[Test Strategy](./test-strategy.md)** - Overall testing strategy and approach
- **[Test Coverage](./test-coverage.md)** - Coverage goals, metrics, and reporting
- **[Integration Testing Guide](./integration-testing-guide.md)** - Guide for writing and running integration tests
- **[Test Fixes Summary](./test-fixes-summary.md)** - Summary of test improvements and fixes

### Test Reports

- **[Test Reports](./test-reports/)** - Directory containing test execution reports and results
- **[Phase 4 Test Report](./test-reports/phase-4-test-report.md)** - Comprehensive testing and validation report

## Testing Overview

### Test Types

1. **Unit Tests** (Jest)
   - Component testing
   - Service testing
   - Utility function testing
   - Coverage target: >90%

2. **Integration Tests** (Playwright)
   - End-to-end user flows
   - API integration testing
   - Database integration testing
   - Coverage target: Critical paths

3. **Performance Tests**
   - Load testing
   - Bundle size analysis
   - Lighthouse scores

### Running Tests

```bash
# Unit tests
npm test
npm run test:watch
npm run test:coverage

# Integration tests
npm run test:integration
npm run test:e2e

# All tests
npm run test:all
```

## Test Coverage

Current coverage metrics:
- Unit Tests: 92%
- Integration Tests: Critical paths covered
- E2E Tests: Main user flows covered

## CI/CD Integration

All tests run automatically on:
- Pull requests (unit + integration)
- Main branch pushes (full suite)
- Pre-deployment (full suite + performance)

## Best Practices

1. **Write tests first** - TDD approach for new features
2. **Mock external services** - Use MSW for API mocking
3. **Test user behavior** - Not implementation details
4. **Keep tests fast** - Parallel execution where possible
5. **Maintain test data** - Use factories and fixtures

## Related Documentation

- [Development](../development/) - Development setup and guidelines
- [DevOps](../devops/) - CI/CD pipeline configuration
- [Features](../features/) - Feature-specific testing requirements 