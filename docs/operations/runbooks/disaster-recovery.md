# Disaster Recovery Runbook

## Overview

This runbook provides step-by-step procedures for recovering from various disaster scenarios in the HEP Companion application.

## Recovery Scenarios

### 1. Complete System Failure

#### Symptoms
- All services are down
- No response from any endpoints
- Database connection failures
- Redis connection failures

#### Recovery Steps
1. **Initial Assessment**
   ```bash
   # Check system status
   docker-compose -f docker-compose.production.yml ps
   
   # Check logs
   docker-compose -f docker-compose.production.yml logs
   ```

2. **Database Recovery**
   ```bash
   # Start database first
   docker-compose -f docker-compose.production.yml up -d db
   
   # Wait for database to be ready
   sleep 30
   
   # Restore from latest backup
   ./scripts/restore.sh /backups/latest_backup.tar.gz
   ```

3. **Service Recovery**
   ```bash
   # Start remaining services
   docker-compose -f docker-compose.production.yml up -d
   
   # Verify services
   curl -f http://localhost/health
   ```

### 2. Database Corruption

#### Symptoms
- Database connection errors
- Inconsistent data
- Failed queries
- Error logs indicating corruption

#### Recovery Steps
1. **Stop Affected Services**
   ```bash
   docker-compose -f docker-compose.production.yml stop app
   ```

2. **Database Recovery**
   ```bash
   # Stop database
   docker-compose -f docker-compose.production.yml stop db
   
   # Remove corrupted data
   docker-compose -f docker-compose.production.yml rm -f db
   
   # Restore from backup
   ./scripts/restore.sh /backups/latest_backup.tar.gz
   ```

3. **Verify Data**
   ```bash
   # Connect to database
   docker-compose -f docker-compose.production.yml exec db psql -U postgres
   
   # Run verification queries
   \dt
   SELECT COUNT(*) FROM users;
   ```

### 3. Redis Cache Failure

#### Symptoms
- Cache misses
- Slow response times
- Redis connection errors
- Cache-related errors in logs

#### Recovery Steps
1. **Stop Redis**
   ```bash
   docker-compose -f docker-compose.production.yml stop redis
   ```

2. **Clear Redis Data**
   ```bash
   docker-compose -f docker-compose.production.yml rm -f redis
   ```

3. **Restore Redis**
   ```bash
   # Start Redis
   docker-compose -f docker-compose.production.yml up -d redis
   
   # Restore from backup
   ./scripts/restore.sh /backups/latest_backup.tar.gz
   ```

### 4. SSL Certificate Expiration

#### Symptoms
- SSL/TLS errors
- Browser security warnings
- API connection failures
- Nginx errors in logs

#### Recovery Steps
1. **Backup Current Certificates**
   ```bash
   cp -r docker/nginx/ssl docker/nginx/ssl.backup
   ```

2. **Update Certificates**
   ```bash
   # Place new certificates
   cp new_cert.crt docker/nginx/ssl/server.crt
   cp new_key.key docker/nginx/ssl/server.key
   ```

3. **Reload Nginx**
   ```bash
   docker-compose -f docker-compose.production.yml restart nginx
   ```

## Verification Procedures

### 1. Health Checks
```bash
# Check all services
curl -f http://localhost/health

# Check database
docker-compose -f docker-compose.production.yml exec db pg_isready

# Check Redis
docker-compose -f docker-compose.production.yml exec redis redis-cli ping
```

### 2. Data Integrity
```bash
# Verify database tables
docker-compose -f docker-compose.production.yml exec db psql -U postgres -c "\dt"

# Check Redis keys
docker-compose -f docker-compose.production.yml exec redis redis-cli keys "*"
```

### 3. Application Functionality
```bash
# Test API endpoints
curl -f https://localhost/api/health
curl -f https://localhost/api/users

# Check logs for errors
docker-compose -f docker-compose.production.yml logs --tail=100
```

## Communication Plan

### 1. Internal Communication
- Notify DevOps team
- Alert development team
- Inform project managers
- Update status page

### 2. External Communication
- Update status page
- Send email notifications
- Post on social media
- Contact affected users

### 3. Documentation
- Document incident details
- Record recovery steps taken
- Update runbook if needed
- Schedule post-mortem meeting

## Prevention Measures

### 1. Regular Maintenance
- Daily backups
- Weekly security scans
- Monthly performance reviews
- Quarterly disaster recovery drills

### 2. Monitoring
- Set up alerts for:
  - Service health
  - Resource usage
  - Security events
  - Certificate expiration

### 3. Documentation
- Keep runbooks updated
- Document all changes
- Maintain contact lists
- Regular review of procedures

## Contact Information

### Emergency Contacts
- DevOps Lead: [Name] - [Phone]
- Database Admin: [Name] - [Phone]
- Security Officer: [Name] - [Phone]
- Legal Team: [Email]

### External Services
- Cloud Provider Support: [Contact]
- SSL Certificate Provider: [Contact]
- Monitoring Service: [Contact]
- Backup Provider: [Contact] 