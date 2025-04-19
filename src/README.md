# HEP Companion

HEP Companion is an AI-powered exercise suggestion platform that generates personalized workout recommendations based on user input. It uses advanced language models to understand user needs and provides tailored exercise plans with detailed instructions.

## Changelog

### v1.0.0 - Initial Release
- Basic exercise suggestion generation
- Simple user interface for input and display
- Direct API integration with language model

### v1.1.0 - Architecture Refactor
- Implemented feature-based architecture
- Separated core, features, shared, and services
- Added proper type definitions and utilities
- Improved code organization and maintainability

## Directory Structure
```
src/
├── app/                      # Next.js routes
│   ├── api/                 # API endpoints
│   ├── suggestions/         # Feature routes
│   ├── success/            # Feature routes
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── core/                    # Application foundation
│   ├── config/             # App configuration
│   ├── types/              # Core types
│   └── utils/              # Core utilities
│
├── features/               # Feature modules
│   ├── exercise/          # Exercise feature
│   │   ├── components/    # Feature components
│   │   ├── hooks/        # Feature hooks
│   │   ├── types/        # Feature types
│   │   └── utils/        # Feature utilities
│   └── suggestions/       # Suggestions feature
│       ├── components/
│       ├── hooks/
│       ├── types/
│       └── utils/
│
├── shared/                # Shared resources
│   ├── components/        # Reusable components
│   ├── hooks/            # Shared hooks
│   └── utils/            # Shared utilities
│
└── services/             # External services
    └── supabase/        # Supabase integration
```

## Import Paths
```typescript
// Examples
import { Type } from '@/core/types';
import { Component } from '@/shared/components';
import { FeatureComponent } from '@/features/exercise/components';
import { Service } from '@/services/supabase';
```

## Development Guidelines

### 1. Feature Development
- Create new features in `features/`
- Each feature must be self-contained
- Use shared resources when possible

### 2. Component Organization
- Feature-specific: `features/[feature]/components/`
- Reusable: `shared/components/`

### 3. Type Definitions
- Core types: `core/types/`
- Feature types: `features/[feature]/types/`

### 4. Service Integration
- External services: `services/[service]/`
- Clear service boundaries

### 5. Utilities
- Core: `core/utils/`
- Feature: `features/[feature]/utils/`
- Shared: `shared/utils/` 