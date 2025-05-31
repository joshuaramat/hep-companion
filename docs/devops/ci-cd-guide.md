# DevOps and CI/CD Guide

## Table of Contents

1. [Overview](#overview)
2. [CI/CD Architecture](#cicd-architecture)
3. [GitHub Actions Workflows](#github-actions-workflows)
4. [Docker and Container Strategy](#docker-and-container-strategy)
5. [Security and Compliance](#security-and-compliance)
6. [Deployment Strategy](#deployment-strategy)
7. [Monitoring and Observability](#monitoring-and-observability)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Future Roadmap](#future-roadmap)

## Overview

HEP Companion follows modern DevOps practices with a focus on automation, security, and reliability. Our CI/CD pipeline implements the GitHub Flow pattern with smart optimizations for efficiency.

### Core Principles

- **Predictability**: Consistent behavior across all branches and environments
- **Safety**: Quality gates prevent untested code from reaching production
- **Efficiency**: Smart optimizations reduce build times and resource usage
- **Simplicity**: Two main workflows handle all CI/CD needs

### Technology Stack

- **CI/CD**: GitHub Actions
- **Container Registry**: GitHub Container Registry (ghcr.io)
- **Container Runtime**: Docker with multi-platform support
- **Security Scanning**: Trivy, CodeQL
- **Testing**: Jest (unit), Playwright (integration)
- **Code Quality**: ESLint, TypeScript
- **Monitoring**: Prometheus, Grafana, Loki

## CI/CD Architecture

### Pipeline Flow

```
Pull Request -> CI (automatic) -> Merge -> CD (automatic) -> Tag -> Production
```

### Workflow Structure

We maintain two primary workflows:

1. **Continuous Integration (ci.yml)**
   - Triggers: All pull requests, pushes to main/develop/release branches
   - Purpose: Quality gates before merge
   - Jobs: Lint, test, build, security scan

2. **Continuous Deployment (docker-cd.yml)**  
   - Triggers: After CI passes on main, version tags, manual dispatch
   - Purpose: Build and deploy production artifacts
   - Jobs: Docker build, vulnerability scan, deploy

### Smart Optimizations

#### Path-Based Testing

The CI workflow detects what changed and runs only relevant tests:

| Changed Files | What Runs | Time Saved |
|--------------|-----------|------------|
| docs/** only | Markdown checks | ~4 minutes |
| src/** | Full CI suite | N/A |
| Dockerfile | Full CI + notice to CD | N/A |
| *.md only | Link validation | ~4 minutes |

#### Parallel Execution

Jobs run simultaneously when possible to reduce total pipeline time:

```
Lint ----+
Test ----+---> Build ---> Deploy
Security-+
```

## GitHub Actions Workflows

### Continuous Integration Workflow

Location: `.github/workflows/ci.yml`

**Key Features:**
- Change detection using dorny/paths-filter
- Parallel job execution
- Conditional test execution
- Coverage reporting to Codecov
- Bundle size analysis
- Single status check for branch protection

**Job Structure:**
1. **changes**: Detects what files changed
2. **lint-and-type-check**: ESLint and TypeScript validation
3. **unit-tests**: Jest unit test execution
4. **build**: Next.js build verification
5. **security**: Trivy vulnerability scanning
6. **integration-tests**: Playwright E2E tests
7. **docs-check**: Markdown link validation
8. **ci-success**: Final status check

### Continuous Deployment Workflow

Location: `.github/workflows/docker-cd.yml`

**Key Features:**
- Triggered by successful CI on main branch
- Multi-platform Docker builds (linux/amd64, linux/arm64)
- Container image signing with Cosign
- Automatic staging deployment
- Tag-based production releases
- Vulnerability scanning of built images

**Job Structure:**
1. **build-and-push**: Docker image creation and registry push
2. **deploy-staging**: Automatic deployment to staging
3. **deploy-production**: Tag-triggered production deployment

### Backup Workflow

Location: `.github/workflows/backup.yml`

**Key Features:**
- Scheduled daily backups at 2 AM UTC
- Manual trigger support
- Flexible storage backends (GitHub Artifacts, S3, GCS)
- 30-day retention policy
- Webhook notifications

## Docker and Container Strategy

### Dockerfile Structure

- Multi-stage build for optimization
- Non-root user execution
- Layer caching optimization
- Health check implementation
- Production-ready base images

### Image Tagging Strategy

- `latest`: Latest stable build from main branch
- `staging`: Current staging deployment
- `v1.2.3`: Semantic version tags
- `main-sha-abc123`: Branch and commit specific
- `pr-123`: Pull request builds

### Registry Management

All images are stored in GitHub Container Registry:
- Registry: `ghcr.io/joshuaramat/hep-companion`
- Multi-platform support (AMD64, ARM64)
- Automatic vulnerability scanning
- Image signing for security

## Security and Compliance

### Security Scanning

1. **Dependency Scanning**
   - Weekly Dependabot updates
   - npm audit in CI pipeline
   - License compliance checks

2. **Container Scanning**
   - Trivy scans on every build
   - Critical/High severity blocking
   - SARIF report generation

3. **Code Scanning**
   - CodeQL static analysis
   - Secret scanning enabled
   - Security policy defined

### Secret Management

- GitHub Secrets for CI/CD variables
- Environment-specific configurations
- No secrets in code or Docker images
- Regular rotation schedule

### Branch Protection

Required for main branch:
- CI Success status check
- One approval review
- Dismiss stale reviews
- No direct pushes

## Deployment Strategy

### Environments

1. **Staging**
   - Auto-deploy from main branch
   - No manual approval required
   - URL: staging.hep-companion.com

2. **Production**
   - Deploy only from version tags
   - Manual approval required
   - URL: hep-companion.com

### Deployment Process

1. Code merged to main
2. CI validates changes
3. CD builds Docker image
4. Auto-deploy to staging
5. Manual testing in staging
6. Create version tag
7. Deploy to production

### Rollback Procedure

1. Identify last stable version
2. Re-run deployment with previous tag
3. Verify application health
4. Document incident and resolution

## Monitoring and Observability

### Current Implementation

- **Metrics**: Prometheus with Grafana dashboards
- **Logs**: Loki for log aggregation
- **Health Checks**: /health and /ready endpoints
- **Uptime**: Basic availability monitoring

### Metrics Tracked

- Build success rate
- Average build time
- Test coverage trends
- Deployment frequency
- Container resource usage

### Gaps to Address

- Application Performance Monitoring (APM)
- Error tracking (Sentry integration planned)
- Distributed tracing
- Custom business metrics

## Best Practices

### Development Workflow

1. Create feature branch from develop
2. Make changes with conventional commits
3. Push branch and create PR
4. CI runs automatically
5. Address any failures
6. Get code review approval
7. Merge to main
8. Monitor staging deployment
9. Create release tag for production

### Commit Standards

Use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test additions/modifications
- `chore:` Maintenance tasks
- `refactor:` Code refactoring
- `perf:` Performance improvements

### Pull Request Guidelines

- Keep PRs small and focused
- Include meaningful description
- Link related issues
- Ensure all checks pass
- Request appropriate reviewers

### Performance Optimization

1. **Dependency Caching**: NPM cache in all workflows
2. **Docker Layer Caching**: BuildKit cache optimization
3. **Parallel Jobs**: Independent tasks run concurrently
4. **Conditional Steps**: Skip unnecessary operations
5. **Resource Limits**: Appropriate runner sizes

## Troubleshooting

### Common Issues

#### CI Failures

**Symptom**: Pull request checks failing
```bash
# Check specific job logs in GitHub Actions
# Common causes:
- Lint errors: Run 'npm run lint' locally
- Test failures: Run 'npm test' locally
- Type errors: Run 'npm run lint:ts' locally
```

#### Docker Build Failures

**Symptom**: CD workflow fails at build stage
```bash
# Check build logs
# Common causes:
- Missing build arguments
- Network timeouts
- Registry authentication issues
```

#### Docker Build Timeout on ARM64

**Symptom**: Docker build failing during npm install on ARM64 architecture

**Solutions**:

1. **Optimize Dockerfile with better caching**:
```dockerfile
# Use specific Node version
FROM node:20-alpine AS builder

# Install dependencies in a separate layer
WORKDIR /app
COPY package*.json ./

# Use npm ci with additional flags for faster installs
RUN npm ci --only=production --prefer-offline --no-audit --no-fund

# Copy source code after dependencies
COPY . .

# Build the application
RUN npm run build
```

2. **Update GitHub Actions workflow with caching**:
```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    platforms: linux/arm64
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    timeout-minutes: 30
```

3. **Use multi-stage builds for efficiency**:
```dockerfile
# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Deployment Issues

**Symptom**: Application not updating after deployment
```bash
# Verify deployment:
- Check workflow completion
- Verify correct image tag
- Review container logs
- Check health endpoints
```

### Debug Commands

```bash
# Local CI simulation
npm run lint && npm test && npm run build

# Docker build locally
docker build -t hep-companion:local .

# Docker build for specific platform
docker build --platform linux/arm64 -t hep-companion:local .

# Test container locally
docker run -p 3000:3000 hep-companion:local

# View workflow runs
gh run list --workflow=ci.yml
gh run view <run-id>
```

### Performance Optimization Tips

1. **Use Docker BuildKit cache mounts**:
```dockerfile
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production
```

2. **Platform-specific builds in parallel**:
```yaml
strategy:
  matrix:
    platform: [linux/amd64, linux/arm64]
    
- name: Build by platform
  uses: docker/build-push-action@v5
  with:
    platforms: ${{ matrix.platform }}
```

3. **Fix deprecated dependencies**:
```bash
# Update deprecated packages
npm update
npm audit fix
```

## Future Roadmap

### Phase 1: Immediate Improvements (Weeks 1-2)

1. **Error Tracking**: Integrate Sentry for production monitoring
2. **Performance Testing**: Add k6 load tests to CI
3. **API Documentation**: Generate OpenAPI specs

### Phase 2: Enhanced Observability (Weeks 3-4)

1. **APM Integration**: Add application performance monitoring
2. **Custom Dashboards**: Business-specific metrics
3. **Alerting**: PagerDuty or similar integration

### Phase 3: Advanced Features (Weeks 5-6)

1. **Feature Flags**: Gradual rollout capabilities
2. **Canary Deployments**: Percentage-based rollouts
3. **Infrastructure as Code**: Terraform for cloud resources

### Phase 4: Optimization (Ongoing)

1. **Build Time Reduction**: Further caching improvements
2. **Cost Optimization**: Efficient resource usage
3. **Developer Experience**: Additional automation

## Maintenance

### Regular Tasks

- Weekly: Review Dependabot PRs
- Monthly: Update base Docker images
- Quarterly: Review and update documentation
- Annually: Major dependency upgrades

### Monitoring Checklist

- [ ] GitHub Actions usage and costs
- [ ] Container registry storage
- [ ] Build time trends
- [ ] Deployment success rates
- [ ] Security scan results

### Team Responsibilities

- **Developers**: Maintain code quality, fix CI failures
- **DevOps**: Workflow maintenance, infrastructure
- **Security**: Vulnerability management, compliance
- **QA**: Test coverage, integration tests

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Trivy Security Scanner](https://aquasecurity.github.io/trivy/)
- [Conventional Commits](https://www.conventionalcommits.org/) 