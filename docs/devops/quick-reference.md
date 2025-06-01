# CI/CD Quick Reference

For comprehensive DevOps and CI/CD documentation, see:
- [DevOps and CI/CD Guide](./devops-guide.md) - Complete guide
- [Workflow Management](./workflow-management.md) - GitHub Actions workflows
- [Backup and Disaster Recovery](./backup-disaster-recovery.md) - Backup procedures
- [DevOps Maturity Roadmap](./devops-maturity-roadmap.md) - Assessment and roadmap

## Quick Commands

### Workflow Management

```bash
# View workflow runs
gh run list --workflow=ci.yml

# Trigger manual deployment
gh workflow run docker-cd.yml

# Cancel a running workflow
gh run cancel <run-id>

# Download artifacts
gh run download <run-id>
```

### Docker Operations

```bash
# Build locally
docker build -t hep-companion:local .

# Run locally
docker run -p 3000:3000 hep-companion:local

# View images
docker images ghcr.io/joshuaramat/hep-companion
```

### Release Process

```bash
# Create a release
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3

# Monitor deployment
gh run list --workflow=docker-cd.yml
```

## Key Workflows

### Continuous Integration (ci.yml)
- **Triggers**: All PRs, pushes to main/develop
- **Jobs**: Lint, test, build, security scan
- **Status Check**: "CI Success"

### Continuous Deployment (docker-cd.yml)
- **Triggers**: After CI passes, version tags
- **Jobs**: Docker build, deploy to staging/production
- **Environments**: staging (auto), production (manual)

### Backup (backup.yml)
- **Schedule**: Daily at 2 AM UTC
- **Storage**: GitHub Artifacts (30 days)
- **Manual Trigger**: `gh workflow run backup.yml`

## Environment URLs

- **Production**: https://hep-companion.com
- **Staging**: https://staging.hep-companion.com
- **Container Registry**: ghcr.io/joshuaramat/hep-companion

## Troubleshooting

For detailed troubleshooting, see the [Workflow Management Guide](./workflow-management.md#troubleshooting).

Common issues:
- **CI not running**: Check PR is created, not just pushed
- **Docker build fails**: Ensure CI passed first
- **Deploy stuck**: Check environment protection rules

## Support

- **Documentation**: See guides linked above
- **Issues**: Create GitHub issue
- **Emergency**: Contact DevOps team via Slack #devops-emergency 