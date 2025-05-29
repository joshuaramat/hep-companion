# Database Migrations

This directory contains the SQL migrations that have been applied to the Supabase database.

## Migrations

- `01_security_schema.sql` - Adds user_id columns, creates audit_logs table, and sets up audit triggers
- `02_rls_policies.sql` - Implements Row-Level Security (RLS) policies for all tables

## How to Apply

These migrations have already been applied directly through the Supabase dashboard. These files are kept for documentation and reference purposes.

If you need to apply these migrations to a different environment, you can use the `apply-migrations.sh` script:

```bash
cd scripts/migrations
bash apply-migrations.sh
```

## Applied Changes

1. **Schema Changes**:
   - Added user_id columns to tables
   - Created audit_logs table
   - Set up audit triggers

2. **Row-Level Security**:
   - Enabled RLS on all tables
   - Created policies to ensure users can only access their own data
   - Blocked anonymous access to all data tables

For more details, see the [SECURITY-IMPLEMENTATION.md](../../SECURITY-IMPLEMENTATION.md) file in the root directory. 