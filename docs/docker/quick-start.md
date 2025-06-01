# Docker Quick Start Guide

## Prerequisites

- Docker Desktop installed and running
- Git for cloning the repository
- OpenAI API key

## Quick Setup (Recommended)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/hep-companion.git
cd hep-companion
```

### 2. Automated Setup

```bash
# Run the automated setup script
./docker/setup.sh
```

This script will:
- Create `.env.docker` from template
- Prompt for your OpenAI API key
- Start all services
- Initialize the database
- Verify the setup

### 3. Access Application

Once setup is complete:

- **Main Application**: http://localhost:3000
- **Database UI**: http://localhost:3002
- **Email Testing**: http://localhost:8025

## Manual Setup (Alternative)

If you prefer manual setup:

### 1. Environment Configuration

```bash
# Copy environment template
cp docker/env.docker.example .env.docker

# Edit the file and update OPENAI_API_KEY
nano .env.docker
```

### 2. Start Services

```bash
# Start all services
npm run docker:dev

# Or using docker-compose directly
docker-compose -f docker/docker-compose.yml --env-file .env.docker up -d
```

### 3. Initialize Database

```bash
# Apply migrations and seed data
npm run docker:db:migrate
npm run docker:db:seed
```

## Service Overview

### Core Application
- **Next.js App**: Main application server
- **PostgreSQL**: Primary database
- **Supabase Auth**: Authentication service

### Development Tools
- **Supabase Studio**: Database management UI
- **Mailhog**: Email testing tool

## Common Commands

### Service Management

```bash
# Start all services
npm run docker:dev

# Stop all services
npm run docker:dev:down

# View running services
npm run docker:ps

# View logs
npm run docker:logs

# View specific service logs
npm run docker:dev:logs
```

### Database Operations

```bash
# Reset database (WARNING: deletes all data)
npm run docker:db:reset

# Apply migrations only
npm run docker:db:migrate

# Seed sample data
npm run docker:db:seed
```

### Development

```bash
# Build for production
npm run docker:prod

# Clean up containers and volumes
npm run docker:clean
```

## Verification

### Check Services

```bash
# View service status
docker-compose -f docker/docker-compose.yml --env-file .env.docker ps
```

All services should show as "Up" and healthy.

### Test Application

1. **Frontend**: Visit http://localhost:3000
2. **Database**: Check http://localhost:3002 (credentials: postgres/postgres)
3. **API Health**: `curl http://localhost:3000/api/health`

### Test Authentication

1. Navigate to http://localhost:3000
2. Try creating an account
3. Check email in Mailhog at http://localhost:8025

## Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check Docker is running
docker --version

# Check port conflicts
netstat -an | grep :3000

# Check logs
npm run docker:logs
```

#### Database Connection Issues
```bash
# Ensure PostgreSQL is running
docker-compose -f docker/docker-compose.yml --env-file .env.docker ps db

# Check database logs
docker-compose -f docker/docker-compose.yml --env-file .env.docker logs db
```

#### Environment Variable Issues
```bash
# Verify .env.docker exists and has correct values
cat .env.docker | grep -v "^#"

# Recreate from template
cp docker/env.docker.example .env.docker
```

### Getting Help

If you encounter issues:

1. Check the [Docker Implementation Guide](./docker-implementation-plan.md)
2. Review [Environment Setup](./environment-setup.md)
3. See [Troubleshooting Guide](../development/troubleshooting.md)

## Next Steps

After successful setup:

1. **Development**: See [Getting Started Guide](../development/getting-started.md)
2. **Testing**: Review [Testing Documentation](../testing/README.md)
3. **Architecture**: Understand the [System Architecture](../architecture/README.md)

## Production Notes

This Docker setup is for **development only**. For production:

- Use proper SSL certificates
- Secure environment variables
- Configure production-grade database
- Set up proper monitoring
- Review [DevOps Documentation](../devops/README.md) 