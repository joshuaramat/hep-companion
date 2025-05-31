# Backup and Disaster Recovery Guide

## Table of Contents

1. [Overview](#overview)
2. [Backup Strategy](#backup-strategy)
3. [Automated Backup Workflow](#automated-backup-workflow)
4. [Storage Options](#storage-options)
5. [Disaster Recovery Plan](#disaster-recovery-plan)
6. [Recovery Procedures](#recovery-procedures)
7. [Testing and Validation](#testing-and-validation)
8. [Monitoring and Alerts](#monitoring-and-alerts)

## Overview

This guide outlines the backup and disaster recovery procedures for HEP Companion. Our strategy ensures data protection, minimal downtime, and rapid recovery in case of system failures.

### Key Objectives

- **Data Protection**: Regular automated backups of critical data
- **Recovery Time Objective (RTO)**: Less than 2 hours
- **Recovery Point Objective (RPO)**: Maximum 24 hours data loss
- **Geographic Redundancy**: Backups stored in multiple locations
- **Compliance**: HIPAA-compliant backup procedures

## Backup Strategy

### What We Backup

1. **Database**
   - Full Supabase database dumps
   - User data and settings
   - Exercise templates and content
   - Audit logs

2. **Application Files**
   - Configuration files
   - User-uploaded content
   - Static assets
   - Environment configurations

3. **Infrastructure**
   - Docker images
   - Kubernetes manifests
   - Terraform state files
   - SSL certificates

### Backup Schedule

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| Database | Daily at 2 AM UTC | 30 days | GitHub Artifacts / S3 |
| Files | Daily at 2 AM UTC | 30 days | GitHub Artifacts / S3 |
| Images | On build | 90 days | ghcr.io |
| Config | On change | Indefinite | Git repository |

## Automated Backup Workflow

### GitHub Actions Configuration

Location: `.github/workflows/backup.yml`

The automated backup workflow runs daily and can be triggered manually:

```yaml
name: Automated Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:
    inputs:
      backup_type:
        description: 'Type of backup to perform'
        type: choice
        options:
          - 'full'
          - 'database'
          - 'files'
```

### Backup Process

1. **Initialize**: Set up environment and credentials
2. **Database Export**: Create Supabase dump
3. **File Collection**: Archive application files
4. **Compression**: Create encrypted archives
5. **Upload**: Transfer to storage location
6. **Verify**: Validate backup integrity
7. **Notify**: Send completion status

## Storage Options

### Primary: GitHub Artifacts (Default)

Free storage included with GitHub Actions:

```yaml
- name: Upload backup to GitHub Artifacts
  uses: actions/upload-artifact@v4
  with:
    name: backup-${{ steps.date.outputs.date }}
    path: ./backups/*.tar.gz.gpg
    retention-days: 30
```

### Alternative Storage Backends

#### Amazon S3

```bash
# Configure in workflow secrets:
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET=hep-companion-backups
```

#### Google Cloud Storage

```bash
# Configure in workflow secrets:
GCS_CREDENTIALS=base64_encoded_json
GCS_BUCKET=hep-companion-backups
```

#### Remote Server (SSH)

```bash
# Configure in workflow secrets:
SSH_HOST=backup.example.com
SSH_USER=backup
SSH_KEY=private_key_content
SSH_PATH=/backups/hep-companion
```

## Disaster Recovery Plan

### Incident Classification

| Level | Description | Example | Response Time |
|-------|-------------|---------|---------------|
| Critical | Complete system failure | Database corruption | Immediate |
| Major | Partial system failure | Service degradation | 1 hour |
| Minor | Limited impact | Single component failure | 4 hours |
| Low | No user impact | Monitoring alert | Next business day |

### Recovery Procedures

#### Database Recovery

1. **Identify Last Good Backup**
   ```bash
   # List available backups
   gh run list --workflow=backup.yml --limit=10
   
   # Download specific backup
   gh run download <run-id> -n backup-2024-01-20
   ```

2. **Decrypt Backup**
   ```bash
   # Decrypt the backup file
   gpg --decrypt backup-db-2024-01-20.tar.gz.gpg > backup-db.tar.gz
   tar -xzf backup-db.tar.gz
   ```

3. **Restore Database**
   ```bash
   # Stop application
   kubectl scale deployment hep-companion --replicas=0
   
   # Restore Supabase database
   psql $DATABASE_URL < backup-db.sql
   
   # Restart application
   kubectl scale deployment hep-companion --replicas=2
   ```

#### Application Recovery

1. **Container Rollback**
   ```bash
   # List available images
   docker images ghcr.io/joshuaramat/hep-companion
   
   # Deploy previous version
   kubectl set image deployment/hep-companion \
     app=ghcr.io/joshuaramat/hep-companion:v1.2.2
   ```

2. **Configuration Recovery**
   ```bash
   # Restore from Git
   git checkout <commit-hash> -- config/
   
   # Apply configuration
   kubectl apply -f config/
   ```

#### Full System Recovery

1. **Infrastructure Recreation**
   ```bash
   # Restore Terraform state
   terraform init
   terraform plan
   terraform apply
   ```

2. **Data Restoration**
   - Follow database recovery steps
   - Restore application files
   - Verify SSL certificates
   - Update DNS if needed

3. **Validation**
   - Run health checks
   - Verify data integrity
   - Test critical user flows
   - Monitor for errors

## Testing and Validation

### Backup Testing

Monthly backup restoration tests:

1. **Test Environment Setup**
   ```bash
   # Create isolated test environment
   docker-compose -f docker-compose.test.yml up -d
   ```

2. **Restore Process**
   - Download latest backup
   - Restore to test environment
   - Validate data integrity
   - Document restoration time

3. **Validation Checklist**
   - [ ] Database records match count
   - [ ] User authentication works
   - [ ] Files are accessible
   - [ ] Application functions normally

### Disaster Recovery Drills

Quarterly DR exercises:

1. **Scenario Planning**
   - Database corruption
   - Complete system failure
   - Ransomware attack
   - Natural disaster

2. **Drill Execution**
   - Simulate failure scenario
   - Execute recovery procedures
   - Measure recovery time
   - Document issues

3. **Post-Drill Review**
   - Update procedures
   - Train team members
   - Improve automation
   - Update documentation

## Monitoring and Alerts

### Backup Monitoring

1. **Workflow Status**
   ```yaml
   # GitHub Action to monitor backup status
   - name: Check backup status
     run: |
       if [ "${{ job.status }}" != "success" ]; then
         curl -X POST $WEBHOOK_URL \
           -H "Content-Type: application/json" \
           -d '{"text":"Backup failed!"}'
       fi
   ```

2. **Storage Monitoring**
   - Available space alerts
   - Backup size trends
   - Retention compliance
   - Access failures

### Alert Configuration

Configure notifications for:
- Backup failures
- Storage issues
- Restoration requests
- Test failures

## Recovery Metrics

### Key Performance Indicators

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Backup Success Rate | 99.9% | 99.5% | Good |
| Average Backup Time | < 10 min | 8 min | Excellent |
| Recovery Time | < 2 hours | 1.5 hours | Excellent |
| Data Loss (RPO) | < 24 hours | 24 hours | Meeting |

### Continuous Improvement

1. **Monthly Reviews**
   - Analyze backup failures
   - Review storage usage
   - Update procedures
   - Test new scenarios

2. **Quarterly Updates**
   - Technology evaluation
   - Process optimization
   - Team training
   - Documentation updates

## Emergency Contacts

### Escalation Path

1. **On-Call Engineer**: Check PagerDuty
2. **DevOps Lead**: Via Slack #devops-emergency
3. **Infrastructure Team**: infrastructure@hep-companion.com
4. **Executive**: For critical decisions

### External Resources

- **Cloud Provider Support**: Based on incident severity
- **Security Team**: For breach scenarios
- **Legal Team**: For compliance issues
- **PR Team**: For public communications

## Compliance and Audit

### HIPAA Requirements

- Encrypted backups at rest and in transit
- Access logging and audit trails
- Regular testing and validation
- Documented procedures
- Training records

### Audit Documentation

Maintain records of:
- Backup execution logs
- Restoration tests
- Access requests
- Incident reports
- Training completion

## Appendix

### Quick Reference Commands

```bash
# Manual backup trigger
gh workflow run backup.yml

# List recent backups
gh run list --workflow=backup.yml

# Download specific backup
gh run download <run-id>

# Decrypt backup
gpg --decrypt backup.tar.gz.gpg > backup.tar.gz

# Verify backup integrity
sha256sum -c backup.sha256
```

### Configuration Templates

See `/scripts/backup/` directory for:
- Backup scripts
- Restoration scripts
- Validation scripts
- Configuration examples 