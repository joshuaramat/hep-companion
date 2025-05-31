#!/bin/bash

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL database
echo "Backing up PostgreSQL database..."
docker-compose -f docker/docker-compose.production.yml exec -T db \
    pg_dump -U postgres --format=custom --file=/tmp/db_backup.dump postgres

# Copy the backup from the container
docker cp $(docker-compose -f docker/docker-compose.production.yml ps -q db):/tmp/db_backup.dump \
    "$BACKUP_DIR/db_backup_$TIMESTAMP.dump"

# Backup Redis data
echo "Backing up Redis data..."
docker-compose -f docker/docker-compose.production.yml exec -T redis \
    redis-cli SAVE

# Copy Redis dump file
docker cp $(docker-compose -f docker/docker-compose.production.yml ps -q redis):/data/dump.rdb \
    "$BACKUP_DIR/redis_backup_$TIMESTAMP.rdb"

# Compress backups
echo "Compressing backups..."
tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" \
    "$BACKUP_DIR/db_backup_$TIMESTAMP.dump" \
    "$BACKUP_DIR/redis_backup_$TIMESTAMP.rdb"

# Remove individual backup files
rm "$BACKUP_DIR/db_backup_$TIMESTAMP.dump" \
   "$BACKUP_DIR/redis_backup_$TIMESTAMP.rdb"

# Clean up old backups
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz" 