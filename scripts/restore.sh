#!/bin/bash

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.tar.gz>"
    exit 1
fi

BACKUP_FILE="$1"
BACKUP_DIR="/backups"
TEMP_DIR="/tmp/restore_$(date +%Y%m%d_%H%M%S)"

# Create temporary directory
mkdir -p "$TEMP_DIR"

# Extract backup
echo "Extracting backup..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the extracted files
DB_BACKUP=$(find "$TEMP_DIR" -name "db_backup_*.dump")
REDIS_BACKUP=$(find "$TEMP_DIR" -name "redis_backup_*.rdb")

if [ -z "$DB_BACKUP" ] || [ -z "$REDIS_BACKUP" ]; then
    echo "Error: Could not find backup files in archive"
    exit 1
fi

# Stop all services
echo "Stopping all services..."
docker-compose -f docker/docker-compose.production.yml down

# Start PostgreSQL
echo "Starting PostgreSQL service..."
docker-compose -f docker/docker-compose.production.yml up -d db

# Wait for PostgreSQL to be ready
sleep 10

# Restore PostgreSQL database
echo "Restoring PostgreSQL database..."
docker cp "$DB_BACKUP" $(docker-compose -f docker/docker-compose.production.yml ps -q db):/tmp/db_backup.dump
docker-compose -f docker/docker-compose.production.yml exec -T db \
    pg_restore -U postgres --clean --if-exists -d postgres /tmp/db_backup.dump

# Start Redis
echo "Starting Redis service..."
docker-compose -f docker/docker-compose.production.yml up -d redis

# Restore Redis data
echo "Restoring Redis data..."
docker cp "$REDIS_BACKUP" $(docker-compose -f docker/docker-compose.production.yml ps -q redis):/data/dump.rdb
docker-compose -f docker/docker-compose.production.yml exec -T redis \
    redis-cli CONFIG SET dir /data
docker-compose -f docker/docker-compose.production.yml restart redis

# Start all services
echo "Starting all services..."
docker-compose -f docker/docker-compose.production.yml up -d

# Clean up
echo "Cleaning up..."
rm -rf "$TEMP_DIR"

echo "Restore completed successfully" 