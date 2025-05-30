# Docker Implementation Plan for HEP Companion

## Overview
This document contains a series of phased prompts for implementing Docker in the HEP Companion project. Each phase builds upon the previous one and can be executed by an AI agent independently.

---

## Phase 1: Basic Next.js Containerization

Create a basic Docker setup for a Next.js 14 application with the following requirements:

1. Create a multi-stage Dockerfile that:
   - Uses Node.js 20 Alpine as the base image
   - Implements a development stage with hot-reload support
   - Implements a production stage with optimized build
   - Properly handles node_modules caching for faster builds
   - Copies only necessary files for each stage

2. Create a .dockerignore file that excludes:
   - node_modules
   - .next
   - .git
   - test results and coverage
   - local environment files

3. Create a docker-compose.yml for local development that:
   - Mounts the source code as a volume for hot-reload
   - Exposes port 3000
   - Sets up environment variables from .env.local
   - Implements health checks

4. Add Docker-related scripts to package.json:
   - docker:build - builds the Docker image
   - docker:dev - runs the development container
   - docker:prod - runs the production container

Ensure the container can successfully run 'npm run dev' and access the application at http://localhost:3000

---

## Phase 2: Supabase Local Development Stack

Extend the existing Docker setup to include a local Supabase development stack with the following requirements:

1. Update docker-compose.yml to add:
   - PostgreSQL 15 container for the database
   - Supabase Studio container for database management
   - Configure networking between Next.js app and database
   - Set up volume persistence for database data

2. Create a docker-compose.override.yml for local Supabase services:
   - Include Supabase Auth (GoTrue) service
   - Include Supabase Storage service
   - Include Supabase Realtime service
   - Configure all services to work together

3. Create an initialization script (docker-entrypoint-initdb.d/):
   - Apply all existing migrations from supabase/migrations/
   - Set up initial database schema
   - Configure RLS policies

4. Update environment configuration:
   - Create .env.docker with Docker-specific Supabase URLs
   - Update the Next.js app to use Docker service names
   - Ensure proper connection strings between services

5. Add database management scripts:
   - docker:db:migrate - runs migrations in Docker
   - docker:db:reset - resets the Docker database
   - docker:db:seed - seeds the Docker database

Test that the application can connect to the Dockerized Supabase instance and perform basic CRUD operations.

---

## Phase 3: Testing Infrastructure

Enhance the Docker setup with a complete testing infrastructure:

1. Create a separate test database service:
   - Add a postgres-test container in docker-compose.test.yml
   - Configure it to run on a different port
   - Set up automatic test database creation and teardown

2. Create a Playwright test container:
   - Build a container with Playwright and all browser dependencies
   - Configure it to run headless tests
   - Set up video recording for failed tests
   - Mount test results as a volume

3. Create a Jest test runner container:
   - Configure for unit and integration tests
   - Set up code coverage volume mounting
   - Enable watch mode for development

4. Update docker-compose files:
   - Create docker-compose.test.yml for testing services
   - Add test-specific environment variables
   - Configure service dependencies

5. Add testing scripts:
   - docker:test:unit - runs Jest tests in Docker
   - docker:test:integration - runs Playwright tests in Docker
   - docker:test:all - runs all tests in Docker
   - docker:test:watch - runs tests in watch mode

Ensure all existing tests pass when run inside Docker containers and that test results are accessible on the host.

---

## Phase 4: CI/CD Integration

Integrate the Docker setup with CI/CD pipelines:

1. Create GitHub Actions workflows:
   - .github/workflows/docker-build.yml for building images
   - .github/workflows/docker-test.yml for running tests
   - Configure matrix builds for different Node versions
   - Implement Docker layer caching for faster builds

2. Add Docker image registry support:
   - Create build scripts for multiple registries (Docker Hub, GitHub Container Registry)
   - Implement semantic versioning for images
   - Add multi-platform builds (amd64, arm64)

3. Create deployment configurations:
   - docker-compose.production.yml for production deployment
   - Kubernetes manifests (optional) in k8s/ directory
   - Health check and readiness probe configurations

4. Add security scanning:
   - Integrate Docker image vulnerability scanning
   - Create .trivyignore for false positives
   - Add SAST scanning for Dockerfiles

5. Documentation and scripts:
   - docker:publish - publishes images to registry
   - docker:deploy - deploys to production
   - Create comprehensive Docker documentation

Ensure the CI/CD pipeline can build, test, and deploy the application using Docker.

---

## Phase 5: Development Environment Optimization

Optimize the Docker development environment for productivity:

1. Implement development tools container:
   - Add a tools container with debugging utilities
   - Include database management tools
   - Add performance profiling tools

2. Create development shortcuts:
   - Makefile with common Docker commands
   - Shell aliases for frequent operations
   - VSCode devcontainer configuration

3. Optimize performance:
   - Implement BuildKit for faster builds
   - Add Docker Compose profiles for selective service startup
   - Configure volume mounts for optimal performance on different OS

4. Add monitoring and logging:
   - Integrate Grafana and Prometheus for metrics
   - Set up centralized logging with Loki
   - Create dashboards for application monitoring

5. Developer documentation:
   - Create onboarding guide for new developers
   - Document common troubleshooting steps
   - Add performance tuning guide

Ensure developers can start working within 5 minutes of cloning the repository.

---

## Phase 6: Production Hardening

Harden the Docker setup for production deployment:

1. Security enhancements:
   - Implement non-root user in containers
   - Add security headers via reverse proxy
   - Configure secrets management
   - Implement network policies

2. Performance optimization:
   - Add Redis for caching
   - Implement CDN integration
   - Configure auto-scaling rules
   - Optimize image sizes

3. Reliability features:
   - Add health checks for all services
   - Implement graceful shutdown
   - Configure restart policies
   - Add backup and restore procedures

4. Observability:
   - Integrate APM (Application Performance Monitoring)
   - Add distributed tracing
   - Configure alerts and notifications
   - Implement SLO/SLI monitoring

5. Compliance and documentation:
   - Document HIPAA compliance measures
   - Create disaster recovery procedures
   - Add runbooks for common issues
   - Implement audit logging

Ensure the production Docker setup meets healthcare compliance requirements and can handle expected load.

## Implementation Notes

1. Always test each phase thoroughly before moving to the next
2. Maintain backward compatibility with existing development workflows
3. Document all changes and update the main README
4. Create rollback procedures for each phase
5. Ensure all team members are trained on new workflows

### Success Criteria:
- Each phase should be completable in 2-4 hours
- All existing functionality must continue working
- No degradation in development experience
- Improved onboarding time for new developers
- Production-ready by Phase 6 