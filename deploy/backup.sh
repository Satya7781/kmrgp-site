#!/bin/bash
# =============================================================================
# Database Backup Script – Mewada Matrimonial App
# Schedule via crontab (run as deployuser):
#   0 2 * * * /var/www/mewada/deploy/backup.sh >> /var/log/mewada/backup.log 2>&1
# =============================================================================
set -e

BACKUP_DIR="/var/www/mewada/backups"
DB_NAME="mewada_db"
DB_USER="mewada_user"
KEEP_DAYS=7

# Create backup directory if needed
mkdir -p "$BACKUP_DIR"

# Timestamped filename
FILENAME="$BACKUP_DIR/mewada_db_$(date +%Y%m%d_%H%M%S).sql.gz"

# Dump and compress
pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILENAME"
echo "[$(date)] Backup created: $FILENAME"

# Prune old backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime "+$KEEP_DAYS" -delete
echo "[$(date)] Old backups (>$KEEP_DAYS days) removed."
