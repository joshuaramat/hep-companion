# Docker Secrets Management

This guide covers managing sensitive configuration files for Docker services.

## Overview

The `docker/secrets/` directory contains sensitive configuration files that should never be committed to version control. All non-example files in this directory are automatically gitignored.

## Usage

1. Copy example files to create actual secret files:
   ```bash
   cp docker/secrets/postgres_password.txt.example docker/secrets/postgres_password.txt
   ```

2. Edit the files with your actual secret values

3. Never commit the actual secret files (they are gitignored)

## Required Files

For production deployment, you need:

- `postgres_password.txt` - PostgreSQL database password

## Security Best Practices

### File Management
- All non-example files in this directory are gitignored
- Use strong, randomly generated passwords
- Regularly rotate secrets
- Never share or commit actual secret values

### Production Considerations
- Consider using a secrets management service in production (e.g., AWS Secrets Manager, HashiCorp Vault)
- Implement proper access controls for secret files
- Use encrypted storage for secrets at rest
- Monitor access to secret files

## Docker Integration

Docker Compose automatically mounts these secrets as files:

```yaml
secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
```

Access in containers:
```bash
# Password is available as a file
cat /run/secrets/postgres_password
```

## Environment Variables vs Secrets

| Method | Use Case | Security Level |
|--------|----------|----------------|
| Environment Variables | Development, non-sensitive config | Low |
| Docker Secrets | Production, sensitive data | High |
| External Secret Managers | Enterprise, highly sensitive | Highest |

## Related Documentation

- [Environment Setup](./environment-setup.md) - Docker environment configuration
- [SSL Setup](./ssl-setup.md) - HTTPS certificate management
- [Security Policy](../security/security-policy.md) - Security policies and procedures 