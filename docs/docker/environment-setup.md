# Docker Environment Configuration

## Security Notice

**NEVER** edit `env.docker.example` with real credentials - it's tracked by Git!

## Correct Setup Process

1. **Copy the template** (this creates a gitignored file):
   ```bash
   cp docker/env.docker.example .env.docker
   ```

2. **Edit `.env.docker`** (safe - this file is gitignored):
   ```bash
   # Add your real OpenAI API key here
   vim .env.docker
   ```

3. **Run Docker**:
   ```bash
   npm run docker:dev
   ```

## File Structure

- `docker/env.docker.example` - Template with placeholder values (tracked by Git)
- `.env.docker` - Your actual configuration (gitignored, never committed)

## Important

- `.env.docker` is in `.gitignore` - safe for secrets
- `docker/env.docker.example` is the template - contains only placeholders
- Never commit files with real API keys or passwords

## What's Pre-configured

The template includes development-safe values for:
- JWT tokens (for local dev only)
- Database passwords (postgres/postgres)
- Service URLs (for Docker networking)

You only need to add:
- Your OpenAI API key
- Any other external service keys you use

## Related Documentation

- [Docker Quick Start](./quick-start.md) - Getting started with Docker development
- [Secrets Management](./secrets-management.md) - Managing sensitive configuration
- [SSL Setup](./ssl-setup.md) - HTTPS configuration 