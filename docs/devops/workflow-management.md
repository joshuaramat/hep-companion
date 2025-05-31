# Workflow Management Guide

## Table of Contents

1. [Overview](#overview)
2. [Workflow Architecture](#workflow-architecture)
3. [Managing Workflows](#managing-workflows)
4. [Common Operations](#common-operations)
5. [Performance Optimization](#performance-optimization)
6. [Troubleshooting](#troubleshooting)
7. [Migration Guide](#migration-guide)

## Overview

This guide covers the management and operation of GitHub Actions workflows for HEP Companion. Our workflow strategy emphasizes simplicity, efficiency, and maintainability.

### Core Workflows

1. **Continuous Integration (ci.yml)**: Quality gates for all code changes
2. **Continuous Deployment (docker-cd.yml)**: Build and deployment pipeline
3. **Automated Backup (backup.yml)**: Daily backup operations

### Design Principles

- **Predictable Behavior**: Consistent patterns across all workflows
- **Smart Optimization**: Only run what's necessary
- **Clear Separation**: CI for validation, CD for deployment
- **Easy Debugging**: Clear job names and structured logs

## Workflow Architecture

### Trigger Strategy

```yaml
# CI Workflow - Automatic on all PRs
on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [main, develop, 'release/**']

# CD Workflow - After CI success
on:
  workflow_run:
    workflows: ["Continuous Integration"]
    types: [completed]
    branches: [main]
```

### Job Dependencies

```
CI Pipeline:
  changes (detect) -> lint-and-type-check -> unit-tests -> build
                   -> security
                   -> integration-tests (conditional)
                   -> docs-check (if docs changed)

CD Pipeline:
  build-and-push -> deploy-staging (auto)
                 -> deploy-production (manual/tag)
```

## Managing Workflows

### Viewing Workflow Status

```bash
# List all workflows
gh workflow list

# View recent runs
gh run list --limit 10

# View specific workflow runs
gh run list --workflow=ci.yml

# View detailed run information
gh run view <run-id>

# Watch a run in progress
gh run watch <run-id>
```

### Manual Workflow Triggers

```bash
# Trigger backup workflow
gh workflow run backup.yml

# Trigger CD with specific inputs
gh workflow run docker-cd.yml \
  -f environment=staging

# Trigger with ref
gh workflow run ci.yml --ref feature/branch
```

### Workflow Configuration

#### Branch Protection Settings

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["CI Success"]
  },
  "dismiss_stale_reviews": true,
  "require_code_owner_reviews": true,
  "required_approving_review_count": 1
}
```

#### Environment Configuration

```yaml
# Production environment settings
environments:
  production:
    protection_rules:
      - type: required_reviewers
        reviewers: ["ops-team"]
      - type: wait_timer
        wait_timer: 10  # minutes
```

## Common Operations

### Creating a New Release

```bash
# 1. Ensure main is up to date
git checkout main
git pull origin main

# 2. Create and push tag
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3

# 3. Monitor deployment
gh run list --workflow=docker-cd.yml
```

### Rerunning Failed Jobs

```bash
# Rerun all failed jobs
gh run rerun <run-id> --failed

# Rerun specific job
gh run rerun <run-id> --job <job-id>

# Debug mode rerun
gh run rerun <run-id> --debug
```

### Canceling Workflows

```bash
# Cancel a specific run
gh run cancel <run-id>

# Cancel all runs for a workflow
gh run list --workflow=ci.yml --json databaseId \
  --jq '.[].databaseId' | xargs -I {} gh run cancel {}
```

### Downloading Artifacts

```bash
# List artifacts for a run
gh run view <run-id> --json artifacts --jq '.artifacts[]'

# Download specific artifact
gh run download <run-id> -n <artifact-name>

# Download all artifacts
gh run download <run-id>
```

## Performance Optimization

### Caching Strategies

```yaml
# NPM dependency caching
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

# Docker layer caching
- uses: docker/setup-buildx-action@v3
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Parallelization

```yaml
# Matrix strategy for multiple versions
strategy:
  matrix:
    node-version: [18.x, 20.x]
    os: [ubuntu-latest, windows-latest]
```

### Conditional Execution

```yaml
# Skip expensive operations when not needed
- name: Integration tests
  if: |
    github.event_name == 'pull_request' && 
    github.base_ref == 'main'
  run: npm run test:integration
```

### Resource Management

```yaml
# Use appropriate runner sizes
runs-on: ubuntu-latest  # 2 CPU, 7GB RAM
# runs-on: ubuntu-latest-4-cores  # For heavy workloads

# Set timeouts
timeout-minutes: 30

# Concurrency control
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

## Troubleshooting

### Common Issues and Solutions

#### Workflow Not Triggering

**Symptoms**: PR created but CI doesn't run

**Solutions**:
```bash
# Check workflow syntax
gh workflow view ci.yml

# Validate YAML
yamllint .github/workflows/ci.yml

# Check branch filters
grep -A5 "branches:" .github/workflows/*.yml
```

#### Timeout Issues

**Symptoms**: Jobs timing out

**Solutions**:
```yaml
# Increase timeout
timeout-minutes: 60

# Add progress indicators
- run: |
    npm test -- --verbose
```

#### Cache Misses

**Symptoms**: Dependencies reinstalling every run

**Solutions**:
```yaml
# Debug cache keys
- run: |
    echo "Cache key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}"
    
# Use fallback keys
restore-keys: |
  ${{ runner.os }}-node-
  ${{ runner.os }}-
```

#### Permission Errors

**Symptoms**: "Resource not accessible by integration"

**Solutions**:
```yaml
# Add required permissions
permissions:
  contents: read
  packages: write
  pull-requests: write
```

### Debug Techniques

#### Enable Debug Logging

```bash
# Set secret in repository
gh secret set ACTIONS_RUNNER_DEBUG --body "true"
gh secret set ACTIONS_STEP_DEBUG --body "true"
```

#### Add Debug Steps

```yaml
- name: Debug context
  env:
    GITHUB_CONTEXT: ${{ toJson(github) }}
  run: |
    echo "$GITHUB_CONTEXT"
    echo "Event: ${{ github.event_name }}"
    echo "Ref: ${{ github.ref }}"
```

#### SSH Debugging

```yaml
- name: Setup tmate session
  if: ${{ failure() }}
  uses: mxschmitt/action-tmate@v3
  timeout-minutes: 15
```

## Migration Guide

### Migrating from Legacy Workflows

If migrating from separate build/test/deploy workflows:

#### Phase 1: Preparation (Day 1)

```bash
# 1. Create new workflow files
cp .github/workflows/ci.yml.new .github/workflows/ci.yml
cp .github/workflows/docker-cd.yml.new .github/workflows/docker-cd.yml

# 2. Commit new workflows
git add .github/workflows/*.yml
git commit -m "feat: add modern CI/CD workflows"
git push origin feature/modern-workflows
```

#### Phase 2: Parallel Running (Week 1)

```yaml
# Temporarily rename old workflows
name: "Legacy CI [DEPRECATED]"

# Add deprecation notice
- name: Deprecation Notice
  run: |
    echo "::warning::This workflow is deprecated. Please use ci.yml"
```

#### Phase 3: Transition (Week 2)

```bash
# Update branch protection
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks.contexts[]="CI Success" \
  --field required_status_checks.strict=true

# Monitor both workflows
gh run list --workflow=ci.yml --workflow=legacy-ci.yml
```

#### Phase 4: Cleanup (Week 3)

```bash
# Disable old workflows
gh workflow disable legacy-ci.yml
gh workflow disable legacy-test.yml
gh workflow disable legacy-deploy.yml

# After verification, remove
git rm .github/workflows/legacy-*.yml
git commit -m "chore: remove deprecated workflows"
```

### Rollback Procedures

If issues arise with new workflows:

```bash
# Quick revert
git revert HEAD~1  # Revert workflow changes
git push origin main

# Or restore from main
git checkout origin/main -- .github/workflows/
git commit -m "revert: restore original workflows"
git push
```

## Best Practices

### Workflow Design

1. **Keep It Simple**: Prefer clarity over cleverness
2. **Use Caching**: Cache dependencies and Docker layers
3. **Fail Fast**: Order jobs by likelihood of failure
4. **Clear Names**: Use descriptive job and step names
5. **Timeout Everything**: Set reasonable timeouts

### Security

1. **Least Privilege**: Only request needed permissions
2. **Pin Actions**: Use SHA references for third-party actions
3. **Secure Secrets**: Never log sensitive information
4. **Review Dependencies**: Audit action dependencies

### Maintenance

1. **Regular Updates**: Keep actions and runners updated
2. **Monitor Usage**: Track GitHub Actions minutes
3. **Clean Artifacts**: Set retention policies
4. **Document Changes**: Update this guide

### Cost Optimization

1. **Use Path Filters**: Skip unnecessary runs
2. **Cancel Redundant**: Cancel outdated runs
3. **Optimize Runners**: Use appropriate sizes
4. **Self-Hosted**: Consider for high usage

## Monitoring and Metrics

### Key Metrics to Track

| Metric | Target | How to Measure |
|--------|--------|----------------|
| CI Duration | < 5 min | Workflow run time |
| CD Duration | < 10 min | Deployment time |
| Success Rate | > 95% | Passed/Total runs |
| Queue Time | < 30s | Time to start |

### Monitoring Commands

```bash
# Get workflow metrics
gh api /repos/:owner/:repo/actions/runs \
  --jq '.workflow_runs | 
    group_by(.name) | 
    map({
      workflow: .[0].name,
      total: length,
      success: map(select(.conclusion == "success")) | length,
      average_duration: (map(.updated_at - .created_at) | add / length)
    })'

# Check usage
gh api /repos/:owner/:repo/actions/billing
```

## Quick Reference

### Essential Commands

```bash
# Workflows
gh workflow list
gh workflow run <workflow>
gh workflow disable <workflow>
gh workflow enable <workflow>

# Runs
gh run list
gh run view <run-id>
gh run cancel <run-id>
gh run rerun <run-id>
gh run download <run-id>

# Debugging
gh run view <run-id> --log
gh run view <run-id> --log-failed
```

### Workflow Syntax

```yaml
# Minimal workflow
name: Example
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Hello"
```

### Useful Resources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Workflow Syntax](https://docs.github.com/actions/reference/workflow-syntax-for-github-actions)
- [Context and Expressions](https://docs.github.com/actions/reference/context-and-expression-syntax-for-github-actions)
- [GitHub CLI Manual](https://cli.github.com/manual/) 