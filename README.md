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

- **Next.js App**: http://localhost:3000
- **Supabase Studio**: http://localhost:3002 (Database UI)
- **MailHog**: http://localhost:8025 (Email testing)
- **PostgreSQL**: localhost:5432
- **API Gateway**: http://localhost:8000

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