#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/apps/personal-room}"
SERVICE_NAME="${SERVICE_NAME:-personal-room}"
PUBLIC_URL="${PUBLIC_URL:-http://106.52.232.205:3001}"
APP_URL="${APP_URL:-http://127.0.0.1:3002}"
REPORT_DIR="${REPORT_DIR:-${APP_DIR}/reports}"

mkdir -p "$REPORT_DIR"
report_file="${REPORT_DIR}/status-$(date -u +%Y%m%dT%H%M%SZ).txt"

{
  printf 'Personal Room Status Report\n'
  printf 'Generated: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf 'APP_DIR=%s\n' "$APP_DIR"
  printf 'SERVICE_NAME=%s\n' "$SERVICE_NAME"
  printf 'PUBLIC_URL=%s\n' "$PUBLIC_URL"
  printf 'APP_URL=%s\n' "$APP_URL"

  printf '\n== uname ==\n'
  uname -a || true

  printf '\n== node/npm ==\n'
  node -v || true
  npm -v || true

  printf '\n== env file presence ==\n'
  if [ -f "${APP_DIR}/.env.production" ]; then
    printf '.env.production exists\n'
    grep -E '^(NEXT_PUBLIC_SITE_URL|STUDIO_COOKIE_SECURE|PERSONAL_ROOM_DATABASE_URL)=' "${APP_DIR}/.env.production" || true
    if grep -q '^STUDIO_PASSWORD_HASH=' "${APP_DIR}/.env.production"; then
      printf 'STUDIO_PASSWORD_HASH is set\n'
    fi
    if grep -q '^STUDIO_SESSION_SECRET=' "${APP_DIR}/.env.production"; then
      printf 'STUDIO_SESSION_SECRET is set\n'
    fi
  else
    printf '.env.production missing\n'
  fi

  printf '\n== ports ==\n'
  ss -ltnp 2>/dev/null | grep -E ':(80|3001|3002)\b' || true

  printf '\n== public curl ==\n'
  curl -I --max-time 8 "${PUBLIC_URL}/" 2>&1 || true
  curl -sS --max-time 8 "${PUBLIC_URL}/api/health" 2>&1 || true

  printf '\n== app curl ==\n'
  curl -I --max-time 8 "${APP_URL}/" 2>&1 || true
  curl -sS --max-time 8 "${APP_URL}/api/health" 2>&1 || true

  printf '\n== systemd ==\n'
  systemctl status "${SERVICE_NAME}.service" --no-pager -l || true

  printf '\n== journal ==\n'
  journalctl -u "${SERVICE_NAME}.service" -n 160 --no-pager || true

  printf '\n== nginx test ==\n'
  nginx -t || true

  printf '\n== nginx matching config ==\n'
  grep -R "personal-room\|3001\|3002\|proxy_pass" /etc/nginx/sites-enabled /etc/nginx/sites-available 2>/dev/null || true

  printf '\n== nginx error log ==\n'
  tail -n 160 /var/log/nginx/error.log 2>/dev/null || true
} >"$report_file"

chmod 600 "$report_file"
printf 'Status report written: %s\n' "$report_file"

