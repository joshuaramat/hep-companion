# Architecture Documentation

This directory contains system architecture, design decisions, and technical specifications for HEP Companion.

## Contents

- **[System Overview](./system-overview.md)** - High-level system architecture and components
- **[Database Design](./database-design.md)** - Database schema, relationships, and design decisions
- **[Database Migrations](./database-migrations.md)** - Migration strategy and guidelines
- **[API Design](./api-design.md)** - API architecture, endpoints, and standards
- **[Security Architecture](./security-architecture.md)** - Security design, threat model, and controls

## Architecture Overview

### Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL with Row-Level Security
- **Authentication**: Supabase Auth
- **AI Integration**: OpenAI GPT-4o
- **Infrastructure**: Docker, GitHub Actions

### Key Design Decisions

1. **Next.js Full-Stack**: Leveraging Next.js for both frontend and API
2. **Supabase Backend**: Using Supabase for auth, database, and real-time features
3. **TypeScript First**: Full type safety across the application
4. **Security by Design**: HIPAA-compliant architecture from the ground up
5. **Containerized Development**: Docker for consistent environments

### System Components

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  Supabase Auth  │────▶│   PostgreSQL    │
│   (Frontend)    │     │                 │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  API Routes     │────▶│   OpenAI API    │     │   Row-Level     │
│   (Backend)     │     │    (GPT-4o)     │     │   Security      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Design Principles

1. **Security First**: Every architectural decision considers security implications
2. **Scalability**: Designed to handle growth in users and data
3. **Maintainability**: Clear separation of concerns and modular design
4. **Performance**: Optimized for healthcare workflow efficiency
5. **Compliance**: HIPAA-compliant design patterns throughout

## Related Documentation

- [Security](../security/) - Security implementation details
- [DevOps](../devops/) - Infrastructure and deployment architecture
- [Features](../features/) - Feature-specific architectural decisions 