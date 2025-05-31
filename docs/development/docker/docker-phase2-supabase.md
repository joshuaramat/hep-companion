# Docker Phase 2: Supabase Local Development Stack

## Overview

Phase 2 adds a complete local Supabase development environment to the Docker setup, eliminating the need for cloud Supabase during development.

## What's Included

### Core Services
- **PostgreSQL 15**: Main database
- **PostgREST**: REST API for database access
- **GoTrue (Auth)**: Authentication service
- **Realtime**: WebSocket connections for real-time updates
- **Storage**: File storage API
- **Kong**: API Gateway routing all services
- **Studio**: Database management UI

### Support Services
- **MailHog**: Email testing interface
- **pg-meta**: Database introspection API

## Quick Start

1. **Copy the environment template**:
   ```bash
   cp docker/env.docker.example .env.docker
   ```
   
   This creates a local `.env.docker` file that is **gitignored** and safe for your secrets.

2. **Update OpenAI API key** in `.env.docker`:
   ```
   OPENAI_API_KEY=your-actual-openai-api-key
   ```

3. **Start all services**:
   ```bash
   npm run docker:dev
   ```

4. **Wait for services to be ready** (about 30-60 seconds):
   ```bash
   # Check service status
   npm run docker:ps
   
   # View logs
   npm run docker:logs
   ```

5. **Access the services**:
   - Next.js App: http://localhost:3000
   - Supabase Studio: http://localhost:3002
   - MailHog (Email): http://localhost:8025
   - API Gateway: http://localhost:8000

## Service URLs and Ports

| Service | Internal URL | External Port | Description |
|---------|--------------|---------------|-------------|
| Next.js App | http://app:3000 | 3000 | Main application |
| PostgreSQL | postgres://db:5432 | 5432 | Database |
| Kong API Gateway | http://kong:8000 | 8000 | Supabase API endpoint |
| PostgREST | http://postgrest:3000 | 3001 | REST API (via Kong) |
| GoTrue Auth | http://auth:9999 | 9999 | Authentication (via Kong) |
| Realtime | http://realtime:4000 | 4000 | WebSockets (via Kong) |
| Storage | http://storage:5000 | 5001 | File storage (via Kong) |
| Studio | http://studio:3000 | 3002 | Database UI |
| MailHog | http://mailhog:1025 | 8025 | Email testing UI |

## Database Management

### Run migrations
```bash
npm run docker:db:migrate
```

### Reset database (caution: deletes all data)
```bash
npm run docker:db:reset
```

### Seed with sample data
```bash
npm run docker:db:seed
```

### Connect with psql
```bash
docker-compose exec db psql -U postgres
```

## Development Workflow

### Starting development
```bash
# Start all services
npm run docker:dev

# View logs for specific service
docker-compose logs -f app    # Next.js logs
docker-compose logs -f db     # Database logs
docker-compose logs -f kong   # API Gateway logs
```

### Stopping services
```bash
# Stop all services (preserves data)
npm run docker:dev:down

# Stop and remove all data
npm run docker:clean
```

### Debugging issues
```bash
# Check service health
npm run docker:ps

# View all logs
npm run docker:logs

# Restart a specific service
docker-compose restart app
```

## Environment Variables

The Docker setup uses `docker/env.docker` which includes:

- **JWT tokens**: Pre-configured for development (DO NOT use in production)
- **Service URLs**: Configured for Docker networking
- **Database credentials**: Default postgres/postgres

### Key Variables

```env
# Supabase API URL (via Kong gateway)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000

# Anonymous key for public access
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Service role key for admin access
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Direct database connection
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

## Testing Authentication

1. **Access MailHog** at http://localhost:8025
2. **Sign up** in your app - confirmation emails appear in MailHog
3. **Test user** is pre-created:
   - Email: test@example.com
   - Password: password123

## Troubleshooting

### Services won't start
```bash
# Check for port conflicts
lsof -i :3000  # Next.js
lsof -i :5432  # PostgreSQL
lsof -i :8000  # Kong

# Clean and restart
npm run docker:clean
npm run docker:dev
```

### Database connection errors
```bash
# Check database is ready
docker-compose exec db pg_isready

# View database logs
docker-compose logs db
```

### Authentication not working
```bash
# Check auth service
docker-compose logs auth

# Verify JWT secret matches
docker-compose exec -T kong env | grep JWT
```

### Next.js can't connect to Supabase
- Ensure `NEXT_PUBLIC_SUPABASE_URL` is `http://localhost:8000`
- Check Kong is running: `docker-compose ps kong`
- View Kong logs: `docker-compose logs kong`

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  Kong Gateway   │
│  (Port 3000)    │     │  (Port 8000)    │
└─────────────────┘     └────────┬────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  PostgREST    │     │   GoTrue      │     │   Storage     │
│  REST API     │     │   Auth        │     │   Files       │
└──────┬────────┘     └──────┬────────┘     └──────┬────────┘
       │                     │                      │
       └─────────────────────┼──────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    │  (Port 5432)    │
                    └─────────────────┘
```

## Next Steps

- Explore the database using Supabase Studio
- Test authentication flows with MailHog
- Run the test suite against local Supabase
- Proceed to Phase 3 for testing infrastructure 