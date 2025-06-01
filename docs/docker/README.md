# Docker Documentation

This directory contains all Docker-related documentation for the HEP Companion project.

## Documentation Structure

### Implementation Guides
- **[Docker Implementation Plan](./docker-implementation-plan.md)** - Phased Docker implementation with AI-executable prompts
- **[Docker Quick Reference](./docker-quick-reference.md)** - Quick commands and troubleshooting guide

### Phase Documentation
- **[Phase 2: Supabase Stack](./docker-phase2-supabase.md)** - Local Supabase development environment setup
- **[Phase 2 Summary](./docker-phase2-summary.md)** - Implementation summary for Phase 2

### Review Documentation
- **[Review Plan](./docker-review-plan.md)** - Systematic review approach for Docker implementation
- **[Review Findings](./docker-review-findings.md)** - Initial review findings and issues
- **[Comprehensive Review](./docker-review-comprehensive.md)** - Detailed analysis and recommendations
- **[Review Summary](./docker-review-summary.md)** - Executive summary of Docker review
- **[Final Summary](./docker-review-final-summary.md)** - Final review summary and action items

### Setup Guides

- **[Quick Start](./quick-start.md)** - Fast Docker setup for development
- **[Environment Setup](./environment-setup.md)** - Environment configuration and security
- **[Secrets Management](./secrets-management.md)** - Managing sensitive configuration
- **[SSL Setup](./ssl-setup.md)** - HTTPS and certificate configuration

## Quick Links

### Common Tasks
- [Setting up Docker environment](./docker-phase2-supabase.md#quick-setup)
- [Running tests in Docker](./docker-quick-reference.md#testing)
- [Troubleshooting common issues](./docker-quick-reference.md#troubleshooting)

### Docker Files Location
All Docker configuration files are located in `/docker/`:
- `docker-compose.yml` - Main development services
- `docker-compose.production.yml` - Production configuration
- `docker-compose.test.yml` - Testing environment
- `docker-compose.dev.yml` - Development tools

### Key Commands
```bash
# Start development environment
npm run docker:dev

# View logs
npm run docker:logs

# Run tests
npm run docker:test:all

# Clean up
npm run docker:clean
```

## Important Notes

1. **Dockerfile Location**: The main `Dockerfile` remains in the project root as per Docker conventions
2. **Environment Files**: Use `.env.docker` for Docker-specific environment variables (gitignored)
3. **Current Architecture**: Using a simplified Supabase stack optimized for this application's needs

For detailed setup instructions, start with the [Docker Phase 2 Supabase guide](./docker-phase2-supabase.md). 