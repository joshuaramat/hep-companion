# HEP Companion Development Documentation

Welcome to the HEP Companion development documentation. This directory contains all technical documentation, guides, and resources for developers working on the project.

## Documentation Structure

### Planning & Project Management
- **[Implementation Plan](./planning/IMPLEMENTATION_PLAN.md)** - Sprint deliverables and systematic implementation phases
- **[Phase 1.2 Implementation Summary](./planning/phase-1.2-implementation-summary.md)** - Environment Variable Guards & API Response Standardization
- **[Changelog](./documentation/CHANGELOG.md)** - Version history and release notes

### Core Documentation  
- **[Project README](./documentation/PROJECT_README.md)** - Original comprehensive project documentation
- **[Docs README](./documentation/DOCS_README.md)** - Documentation organization guide

### Security Documentation
- **[Security Implementation](./security/SECURITY-IMPLEMENTATION.md)** - HIPAA compliance, RLS, audit trails
- **[Security Headers Implementation](./security/security-headers-implementation.md)** - Phase 1 security headers implementation
- **[Security README](./security/SECURITY_README.md)** - Security overview and guidelines

### Testing Documentation
- **[Test Coverage Plan](./testing/test-coverage-plan.md)** - Comprehensive testing strategy
- **[Integration Testing](./testing/INTEGRATION_TESTING_README.md)** - Integration test setup and guidelines

### User Guides
- **[Enterprise SSO](./user-guides/enterprise-sso.md)** - Enterprise single sign-on configuration
- **[User Onboarding Flow](./user-guides/user-onboarding-flow.md)** - User onboarding process documentation

### Scripts & Database
- **[Scripts README](./scripts/SCRIPTS_README.md)** - Development and deployment scripts
- **[Migrations README](./database/MIGRATIONS_README.md)** - Database migration documentation

### Docker Implementation
- **[Docker Implementation Plan](./docker-implementation-plan.md)** - Phased Docker implementation with AI-executable prompts
- **[Docker Quick Reference](./docker-quick-reference.md)** - Phase overview and quick commands

## Quick Start for Developers

### Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)
- OpenAI API access

### Setup Process
1. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Configure required environment variables
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # See database/MIGRATIONS_README.md for details
   npm run db:migrate
   npm run db:seed
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Supabase PostgreSQL
- **AI**: OpenAI GPT-4o with structured outputs
- **Authentication**: Supabase Auth with RLS
- **Deployment**: Vercel

### Key Design Principles
- **Security First**: HIPAA-adjacent compliance requirements
- **Evidence-Based**: All exercise recommendations backed by research
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized for clinical workflow efficiency

## Current Sprint Status

Refer to the [Implementation Plan](./planning/IMPLEMENTATION_PLAN.md) for:
- Deliverable tracking
- Phase-based development approach
- Security baseline requirements
- AI enhancement roadmap

## Testing Strategy

See [Test Coverage Plan](./testing/test-coverage-plan.md) for:
- Unit testing approach
- Integration testing setup
- E2E testing with Playwright
- Security testing requirements

## Security Considerations

Review [Security Implementation](./security/SECURITY-IMPLEMENTATION.md) for:
- Row Level Security (RLS) configuration
- Audit trail implementation
- Environment variable security
- PHI handling protocols

## Contributing

1. **Review Documentation**: Start with relevant docs in this directory
2. **Follow Security Guidelines**: Ensure all changes meet security requirements
3. **Test Thoroughly**: Run full test suite before submitting
4. **Update Documentation**: Keep documentation current with changes

## Getting Help

- **Technical Issues**: Check existing documentation first
- **Security Questions**: Refer to security documentation
- **Testing Help**: Review testing documentation
- **Feature Requests**: Create detailed implementation plan

---

**Remember**: This is a healthcare application with strict security and compliance requirements. Always prioritize patient data protection and clinical accuracy in development decisions. 