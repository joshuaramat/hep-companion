# GitHub Actions Workflows

## Overview

Our CI/CD follows the industry-standard GitHub Flow pattern with smart optimizations for efficiency.

## The Pattern: PR → CI → CD → Deploy

```
Pull Request → CI (automatic) → Merge → CD (automatic) → Tag → Production
```

## Workflow Structure

### Active Workflows (2 Total)

#### 1. `ci.yml` - Continuous Integration
- **Triggers**: ALL pull requests (automatic!), pushes to main/develop
- **Purpose**: Quality gates before merge
- **Features**: 
  - Path-based testing (only runs what's needed)
  - Parallel job execution
  - Security scanning integrated
  - Coverage reporting
  - Single status check for branch protection

#### 2. `docker-cd.yml` - Continuous Deployment  
- **Triggers**: After CI passes on main, version tags, manual dispatch
- **Purpose**: Build and deploy production artifacts
- **Features**:
  - Multi-platform Docker builds
  - Container image signing
  - Auto-deploy to staging
  - Tag-based production releases
  - Vulnerability scanning

## Smart Optimizations

### Path-Based Testing

The CI workflow detects what changed and runs only relevant tests:

| Changed Files | What Runs | Time Saved |
|--------------|-----------|------------|
| `docs/**` only | Markdown checks | ~4 minutes |
| `src/**` | Full CI suite | N/A |
| `Dockerfile` | Full CI + notice to CD | N/A |
| `*.md` only | Link validation | ~4 minutes |

### Example Scenarios

**Scenario 1: Update README**
```bash
git add README.md
git commit -m "docs: fix typo"
# Result: 30-second CI run (only markdown checks)
```

**Scenario 2: Fix React Bug**
```bash
git add src/components/Button.tsx  
git commit -m "fix: button state"
# Result: 3-5 minute CI run (lint, test, build)
```

**Scenario 3: Release to Production**
```bash
git tag v1.2.3
git push origin v1.2.3
# Result: CD builds Docker, deploys to production
```

## Why This Structure?

### Benefits

1. **Predictable**: Same pattern every time
2. **Fast**: Only runs what's needed  
3. **Safe**: Can't skip quality gates
4. **Simple**: Just 2 workflows to understand

### What We Avoided

- **Dynamic workflow selection**: Too unpredictable
- **Monolithic workflows**: Hard to debug
- **Too many workflows**: Maintenance nightmare
- **Complex conditions**: Confusing for team

## Quick Reference

### For Developers

1. **Create PR** → CI runs automatically
2. **Get approval** → Merge to main
3. **CD runs** → Deploys to staging
4. **Tag release** → Deploys to production

### For DevOps

1. **Monitor CI performance** via Actions tab
2. **Check CD status** for deployment health
3. **Review security** in Security tab
4. **Track metrics** in Insights

## Configuration

### Required Branch Protection

```yaml
Settings → Branches → main:
- Require status checks: "CI Success"
- Require PR reviews: 1
- Dismiss stale reviews: Yes
- Include administrators: No
```

### Required Secrets

- `CODECOV_TOKEN` - For test coverage
- `GITHUB_TOKEN` - Automatic, for packages

### Environments

1. **staging** - Auto-deploy from main
2. **production** - Manual approval, tag-based

## Troubleshooting

### "CI didn't run on my PR"

- Did you create the PR? (not just push)
- Check Actions tab for errors

### "Docker build failed"  

- CI must pass first
- Check build logs in CD workflow

### "Can't merge PR"

- Wait for "CI Success" check
- Get required approval

## Best Practices

1. **Keep PRs small** - Faster CI, easier reviews
2. **Use conventional commits** - Clear history
3. **Don't skip CI** - It's there to help
4. **Tag releases properly** - `v1.2.3` format

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| CI Time (docs) | < 1 min | 30s |
| CI Time (code) | < 5 min | 3-4 min |
| CD Time | < 10 min | 8 min |
| Success Rate | > 95% | Track weekly |

## Future Improvements

- [ ] Add deployment smoke tests
- [ ] Implement canary releases
- [ ] Add performance benchmarks
- [ ] Cache Docker layers better

## Why No "Lightweight" CI?

We removed the separate lightweight workflow because:
1. The main CI already skips unnecessary steps
2. One workflow is easier to maintain than two
3. Path filtering achieves the same speed benefits
4. Consistency is more valuable than micro-optimizations

Remember: **Boring technology is good technology** in CI/CD! 