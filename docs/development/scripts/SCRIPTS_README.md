# Development Scripts

This directory contains utility scripts organized by purpose for development, testing, and database management.

## Directory Structure

- **database/**: Scripts for database management and fixes
- **security/**: Scripts for implementing and fixing security features
- **user/**: Scripts for user management and testing
- **utils/**: Utility scripts for development tasks
- **migrations/**: SQL migrations and database schema changes

## Scripts

### User Management (`user/`)

- **create-test-user.js**: Creates test users with pre-confirmed emails for testing the onboarding flow
  ```bash
  # Generate a random test user
  npm run create-test-user
  
  # Specify an email
  npm run create-test-user test@example.com
  
  # Specify email and password
  npm run create-test-user test@example.com password123
  ```

### Security Management (`security/`)

- **fix-audit-logs-policy.js**: Fixes Row-Level Security (RLS) policies for the `audit_logs` table
  ```bash
  npm run fix-audit-logs
  ```

- **deploy-security.js**: Interactive script for deploying security features to your Supabase database
  ```bash
  npm run deploy-security
  ```

### Database Management (`database/`)

- **fix-organization-constraint.js**: Fixes organization constraint issues
  ```bash
  npm run fix-organization
  ```

- **sql-fix-organization-constraint.js**: SQL-based version of the organization constraint fix
  ```bash
  npm run fix-organization-sql
  ```

### Utilities (`utils/`)

- **check-env.js**: Verifies that required environment variables are set
  ```bash
  npm run check-env
  ```

### Database Migrations (`migrations/`)

- **apply-migrations.sh**: Applies all pending migrations to the database
  ```bash
  npm run migrate
  ```

## Common Issues and Solutions

### Row-Level Security (RLS) Errors

If you encounter errors like "violates row-level security policy", run the fix script:
```bash
npm run fix-audit-logs
```

### Need Test Users for Onboarding

When testing the user onboarding flow and you've run out of test emails, create pre-verified test users:
```bash
npm run create-test-user
```

## Requirements

These scripts require the following environment variables to be set in your `.env` file:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**IMPORTANT**: The service role key provides admin access to your database. Never expose it in client-side code or commit it to your repository. 