#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/apps/personal-room}"
DATA_FILE="${DATA_FILE:-${APP_DIR}/data/personal-room.json}"
BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  printf 'Usage: ./deploy/restore-data.sh /path/to/personal-room-backup.json\n' >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  printf 'Backup file not found: %s\n' "$BACKUP_FILE" >&2
  exit 1
fi

mkdir -p "$(dirname "$DATA_FILE")"

if [ -f "$DATA_FILE" ]; then
  safety_copy="${DATA_FILE}.before-restore.$(date -u +%Y%m%dT%H%M%SZ)"
  cp "$DATA_FILE" "$safety_copy"
  printf 'Current data safety copy: %s\n' "$safety_copy"
fi

cp "$BACKUP_FILE" "$DATA_FILE"
chmod 600 "$DATA_FILE"

printf 'Restored file-store data to %s\n' "$DATA_FILE"

