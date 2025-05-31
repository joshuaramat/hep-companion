# Security Implementation Documentation

This document outlines the security measures implemented in the HEP Companion application, focusing on Row-Level Security (RLS), audit logging, and patient data protection.

## Overview

The HEP Companion application implements the following security measures:

1. **Row-Level Security (RLS)**: Ensures users can only access their own data
2. **Audit Logging**: Tracks all significant user actions for compliance and security
3. **Patient Key Hashing**: Securely stores patient identifiers using SHA-256 hashing
4. **Content Security Policy (CSP)**: Prevents cross-site scripting attacks
5. **HTTP Strict Transport Security (HSTS)**: Enforces secure connections

## Row-Level Security (RLS)

RLS is implemented at the database level to ensure that users can only access rows they own, regardless of application-level security.

### Policy Configuration

- Authentication required for all data access
- Anonymous users have no access to data
- Authenticated users can only access their own data
- Access control is enforced by checking `user_id` against `auth.uid()`

### Table-specific Policies

- **Prompts**: Direct ownership through `user_id` column
- **Suggestions**: Access through relationship with prompts table
- **Feedback**: Direct ownership through `user_id` column
- **Citations**: Access through relationship with suggestions table
- **Audit Logs**: Users can only view their own audit records

## Audit Logging

A comprehensive audit trail is implemented to track all significant user actions:

- **Database Triggers**: Automatically logs changes to prompts and feedback
- **Application-level Logging**: Additional context captured in API routes
- **Retention Policy**: 90-day automatic purge of audit logs via scheduled function
- **Log Structure**: Each log includes user ID, action, resource type, timestamp, and details

## Patient Data Protection

Patient identification is protected using the following measures:

- **SHA-256 Hashing**: Patient MRNs are never stored directly; only the hash is kept
- **Compound Key**: Hash combines MRN and clinic ID to create a unique identifier
- **No Reversibility**: One-way hashing prevents recovery of original MRN
- **Optional Fields**: Patient identification is optional to support various workflows

## Additional Security Measures

### Content Security Policy (CSP)

CSP headers are implemented in production to:
- Restrict script sources to prevent XSS
- Control resource loading
- Prevent clickjacking with frame-ancestors directive

### HTTP Strict Transport Security (HSTS)

HSTS is enabled in production to:
- Force HTTPS connections
- Include subdomains in the policy
- Set a long max-age (2 years)

## Development Considerations

When developing new features, follow these guidelines:

1. Add `user_id` to all new tables that store user data
2. Implement RLS policies for all new tables
3. Add audit logging for significant user actions
4. Never store patient identifiers directly; always use the hashing utility
5. Test access control by impersonating different users

## Security Testing

Before deploying changes, verify:

1. Authenticated users can only see their own data
2. Unauthenticated requests are rejected
3. Audit logs are created correctly
4. Patient keys are properly hashed
5. Access attempts from unauthorized users are blocked and logged 