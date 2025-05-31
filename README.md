# HEP Companion

[![CI](https://github.com/joshuaramat/hep-companion/actions/workflows/ci.yml/badge.svg)](https://github.com/joshuaramat/hep-companion/actions/workflows/ci.yml)
[![Docker CD](https://github.com/joshuaramat/hep-companion/actions/workflows/docker-cd.yml/badge.svg)](https://github.com/joshuaramat/hep-companion/actions/workflows/docker-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Healthcare Exercise Prescription system designed for clinicians to generate evidence-based exercise recommendations with AI assistance.

## Documentation

For comprehensive documentation, please refer to:

**[Documentation Index](./docs/)**

### Quick Links
- [Getting Started](./docs/development/getting-started.md)
- [Architecture Overview](./docs/architecture/)
- [DevOps Guide](./docs/devops/)
- [User Guides](./docs/user-guides/)

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

For detailed development setup and workflow, see [Getting Started Guide](./docs/development/getting-started.md).

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

> **Note**: The Docker setup uses a simplified Supabase stack optimized for this application's needs. For details, see [Docker Documentation](./docs/docker/).

## CI/CD and DevOps

The project implements modern DevOps practices with automated CI/CD pipelines. For comprehensive documentation, see:

**[DevOps Documentation](./docs/devops/)**

### Key Components

- **Continuous Integration**: Automated testing, linting, and security scanning on all pull requests
- **Continuous Deployment**: Automated Docker builds and deployments to staging/production
- **Backup Strategy**: Daily automated backups with disaster recovery procedures
- **Monitoring**: Prometheus, Grafana, and Loki for observability

### Quick Commands

```bash
# View CI/CD status
gh run list --workflow=ci.yml

# Deploy to production
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# Manual backup
gh workflow run backup.yml

# View logs
docker-compose -f docker-compose.production.yml logs
```

For detailed information, see:
- [CI/CD Guide](./docs/devops/ci-cd-guide.md)
- [Workflow Management](./docs/devops/workflow-management.md)
- [Backup and Disaster Recovery](./docs/devops/backup-disaster-recovery.md)
- [Quick Reference](./docs/devops/quick-reference.md)

## License

This project is licensed under the MIT License. 