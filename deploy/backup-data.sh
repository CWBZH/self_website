#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/apps/personal-room}"
BACKUP_DIR="${BACKUP_DIR:-${APP_DIR}/backups}"
DATA_FILE="${DATA_FILE:-${APP_DIR}/data/personal-room.json}"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DATA_FILE" ]; then
  printf 'No file-store data found at %s\n' "$DATA_FILE"
  exit 0
fi

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="${BACKUP_DIR}/personal-room-${timestamp}.json"

cp "$DATA_FILE" "$backup_file"
chmod 600 "$backup_file"

printf 'Backup created: %s\n' "$backup_file"

