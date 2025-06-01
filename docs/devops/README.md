# DevOps Documentation

This directory contains all DevOps and CI/CD related documentation for HEP Companion.

## Contents

### Core Guides

- **[CI/CD Guide](./ci-cd-guide.md)** - Comprehensive guide to the CI/CD pipeline, workflows, and best practices
- **[Workflow Management](./workflow-management.md)** - Managing GitHub Actions workflows, troubleshooting, and optimization
- **[Quick Reference](./quick-reference.md)** - Quick commands and common operations

### Operations

- **[Backup and Disaster Recovery](./backup-disaster-recovery.md)** - Backup strategies, disaster recovery procedures, and testing
- **[Deployment Guide](./deployment-guide.md)** - Deployment procedures for staging and production environments
- **[Monitoring and Observability](./monitoring-observability.md)** - Monitoring setup, metrics, and alerting

### Planning

- **[Maturity Roadmap](./maturity-roadmap.md)** - DevOps maturity assessment and improvement roadmap

## Quick Start

For new team members:
1. Start with the [CI/CD Guide](./ci-cd-guide.md) to understand the pipeline
2. Review [Quick Reference](./quick-reference.md) for common commands
3. Familiarize yourself with [Workflow Management](./workflow-management.md)

## Key Workflows

- **CI Pipeline**: Runs on all pull requests automatically
- **CD Pipeline**: Deploys after CI passes on main branch
- **Backup**: Runs daily at 2 AM UTC

## Important Commands

```bash
# View workflow status
gh run list --workflow=ci.yml

# Deploy to production
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# Manual backup
gh workflow run backup.yml
```

## Related Documentation

- [Docker Setup](../docker/) - Container configuration and management
- [Operations Runbooks](../operations/runbooks/) - Operational procedures
- [Security](../security/) - Security policies and compliance 