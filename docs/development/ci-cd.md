# CI/CD Guide

## Overview

This project uses GitHub Actions for continuous integration and continuous deployment. The CI/CD pipeline ensures code quality, security, and automated testing before deployment.

## Workflow Overview

### Continuous Integration (CI)

The CI pipeline runs on:
- Pull requests to any branch
- Pushes to `main`, `develop`, and `release/**` branches
- Manual workflow dispatch

#### CI Jobs

1. **Change Detection** - Optimizes job execution by detecting what changed
2. **Lint & Type Check** - ESLint and TypeScript validation
3. **Unit Tests** - Fast unit tests with coverage reporting
4. **Build Verification** - Ensures the application builds successfully
5. **Security Scanning** - Trivy vulnerability scanning
6. **Integration Tests** - Playwright end-to-end tests
7. **Documentation Check** - Markdown link validation

### Job Dependencies

```
changes (always runs)
├── lint-and-type-check
├── unit-tests
│   └── integration-tests
├── build
│   └── integration-tests
├── security (independent)
└── docs-check (if docs changed)
```

## Environment Variables

### CI Environment Setup

The CI pipeline uses test environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
OPENAI_API_KEY=test-api-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
FAIL_ON_ENV_ERROR=false
```

### Required Secrets

Configure these in your GitHub repository settings:

- `CODECOV_TOKEN` - For test coverage reporting
- `GITHUB_TOKEN` - Automatically provided by GitHub

## Running CI Locally

### Prerequisites

```bash
# Install dependencies
npm ci

# Setup environment
cp docker/env.docker.example .env.local
# Update OPENAI_API_KEY in .env.local
```

### Run Individual Checks

```bash
# Linting and type checking
npm run lint
npm run lint:ts

# Unit tests
npm run test:unit

# Build verification
npm run build

# Integration tests
npm run test:integration

# Security scanning (requires Docker)
docker run --rm -v $(pwd):/app aquasec/trivy fs /app
```

### Full CI Simulation

```bash
# Run all checks
npm run ci

# Or manually run the sequence
npm run lint && \
npm run lint:ts && \
npm run test:unit && \
npm run build && \
npm run test:integration
```

## Troubleshooting

### Common Issues

#### Build Failures
- **Environment Variables**: Ensure all required env vars are set
- **Dependencies**: Run `npm ci` to install exact versions
- **Node Version**: Use Node.js 18.x

#### Test Failures
- **Flaky Tests**: Re-run failed tests
- **Environment**: Check test environment setup
- **Timeouts**: May need to increase test timeouts for slower environments

#### Security Scan Issues
- **False Positives**: Update `.trivyignore` if needed
- **Critical Vulnerabilities**: Update dependencies immediately

### Performance Optimization

#### Speeding Up CI

1. **Dependency Caching**: Enabled for npm packages
2. **Change Detection**: Only runs relevant jobs
3. **Parallel Execution**: Jobs run concurrently when possible
4. **Artifact Caching**: Build outputs cached between jobs

#### Resource Limits

- **Timeout**: Jobs timeout after 30 minutes
- **Concurrency**: Limited by GitHub plan
- **Storage**: Artifacts retained for 7 days

## Best Practices

### Code Quality
- Fix linting errors before committing
- Maintain test coverage above 80%
- Address security vulnerabilities promptly

### Workflow Management
- Use descriptive commit messages
- Keep PRs focused and small
- Review CI failures promptly

### Documentation
- Update docs when changing CI configuration
- Document any new environment variables
- Keep troubleshooting guide current

## Monitoring

### Status Checks
- All CI jobs must pass for merge
- Branch protection rules enforce requirements
- Status badges show current build state

### Metrics
- Build duration tracking
- Test coverage trends
- Security scan results

## See Also

- [Development Guide](./getting-started.md)
- [Testing Strategy](../testing/README.md)
- [DevOps Documentation](../devops/README.md)
- [Security Guidelines](../security/README.md) 