# HEP Companion

A Healthcare Exercise Prescription system designed for clinicians to generate evidence-based exercise recommendations with AI assistance.

## Quick Start

This project uses Next.js 14, TypeScript, Supabase, and Tailwind CSS. For detailed documentation, setup instructions, and development guides, please refer to:

**[Development Documentation](./docs/development/)**

## Key Features

- **Clinical Focus**: Evidence-based exercise prescriptions for LBP, ACL, and PFP conditions
- **AI-Powered**: GPT-4o integration with medical knowledge base
- **HIPAA-Ready**: Security-first architecture with RLS and audit trails  
- **Modern UI**: Responsive design with accessibility standards
- **Citation-Based**: All recommendations backed by peer-reviewed research

## Development Environment

### Quick Start with VSCode (Recommended)

1. Install prerequisites:
   - Docker Desktop
   - VSCode with Remote Containers extension
   - Git

2. Clone and open in VSCode:
   ```bash
   git clone https://github.com/your-org/hep-companion.git
   cd hep-companion
   code .
   ```

3. Click "Open Folder in Container" when prompted

4. Start services:
   ```bash
   # Start all services
   make dev

   # Start development tools
   make dev-tools

   # Start monitoring stack
   make monitoring
   ```

### Development Tools

- **Debugging**: Node.js debugger on port 9229
- **Performance**: Clinic.js profiling
- **Database**: PostgreSQL client and management tools
- **Monitoring**: Grafana, Prometheus, and Loki

### Common Commands

```bash
# Run tests
make test
make test-watch
make test-integration

# Database operations
make db-backup
make db-restore file=backup.sql
make db-reset

# Debugging
make debug cmd="npm run dev"
make profile cmd="npm run dev"

# View logs
make logs
```

For detailed development setup and workflow, see [Developer Onboarding Guide](./docs/development/onboarding.md).

## Development

### Option 1: Docker Setup (Recommended)

```bash
# Quick setup with local Supabase
./docker/setup.sh

# Or manual setup:
cp docker/env.docker.example .env.docker
# Update OPENAI_API_KEY in .env.docker (this file is gitignored)
npm run docker:dev
```

Visit `http://localhost:3000` to access the application.

### Option 2: Traditional Setup

```bash
# Install dependencies
npm install

# Set up environment variables (see development docs)
cp .env.example .env.local

# Run development server
npm run dev
```

## Docker Services

When using Docker, you get a complete local development environment:

- **Next.js App** - Running on http://localhost:3000
- **PostgreSQL** - Database on port 5432
- **Supabase Auth** - Authentication service on port 9999
- **Supabase Studio** - Database UI on http://localhost:3002
- **Mailhog** - Email testing UI on http://localhost:8025

> **Note**: The Docker setup uses a simplified Supabase stack optimized for this application's needs. It includes only the essential services: database, auth, and studio. For details on the architectural decision and recent review findings, see [Docker Review Summary](./docs/development/docker-review-summary.md) and [Comprehensive Review](./docs/development/docker-review-comprehensive.md).

For comprehensive setup, architecture, and contribution guidelines, see the [Development Documentation](./docs/development/).

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

### Build Pipeline
- Automated builds on push to main and pull requests
- Multi-platform support (amd64, arm64)
- Docker layer caching for faster builds
- Security scanning with Trivy and CodeQL

### Test Pipeline
- Unit tests with Jest
- Integration tests with Playwright
- Code coverage reporting
- Test results artifacts

### Deployment
- Production deployment with Docker Compose
- Kubernetes deployment support
- Automated rollbacks
- Health checks and monitoring

### Security
- Weekly vulnerability scans
- SAST scanning with CodeQL
- Container scanning with Trivy
- Secret management

### Usage

```bash
# Build and publish Docker image
npm run docker:publish

# Deploy to production
npm run docker:deploy

# Rollback deployment
npm run docker:deploy:rollback

# Security scanning
npm run docker:security:scan

# View production logs
npm run docker:logs:prod
```

For detailed CI/CD documentation, see [CI/CD Guide](./docs/development/ci-cd.md).

## License

This project is licensed under the MIT License. 