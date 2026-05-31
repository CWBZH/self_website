#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/apps/personal-room}"
ZIP_FILE="${1:-personal-room-deploy.zip}"

if [ ! -f "$ZIP_FILE" ]; then
  printf 'Release zip not found: %s\n' "$ZIP_FILE" >&2
  exit 1
fi

mkdir -p "$APP_DIR"

if [ -d "$APP_DIR" ] && [ "$(find "$APP_DIR" -mindepth 1 -maxdepth 1 2>/dev/null | wc -l)" -gt 0 ]; then
  backup_dir="${APP_DIR}.before-unpack.$(date -u +%Y%m%dT%H%M%SZ)"
  mkdir -p "$backup_dir"
  find "$APP_DIR" -mindepth 1 -maxdepth 1 \
    ! -name '.env.production' \
    ! -name 'data' \
    ! -name 'backups' \
    -exec mv {} "$backup_dir"/ \;
  printf 'Previous app files moved to %s\n' "$backup_dir"
fi

unzip -o "$ZIP_FILE" -d "$APP_DIR"
chmod +x "$APP_DIR"/deploy/*.sh

printf 'Release unpacked to %s\n' "$APP_DIR"

