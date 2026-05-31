#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${SERVICE_NAME:-personal-room}"
PUBLIC_PORT="${PUBLIC_PORT:-3001}"
APP_PORT="${APP_PORT:-3002}"
APP_HOST="${APP_HOST:-127.0.0.1}"
SITE_URL="${SITE_URL:-http://106.52.232.205:${PUBLIC_PORT}}"

section() {
  printf '\n== %s ==\n' "$1"
}

section "Public endpoint"
set +e
curl -I --max-time 6 "${SITE_URL}/" 2>&1
curl -sS --max-time 6 "${SITE_URL}/api/health" 2>&1
set -e

section "Local app endpoint"
set +e
curl -I --max-time 6 "http://${APP_HOST}:${APP_PORT}/" 2>&1
curl -sS --max-time 6 "http://${APP_HOST}:${APP_PORT}/api/health" 2>&1
set -e

section "Listening ports"
if command -v ss >/dev/null 2>&1; then
  ss -ltnp | grep -E ":(${PUBLIC_PORT}|${APP_PORT})\\b" || true
else
  netstat -ltnp 2>/dev/null | grep -E ":(${PUBLIC_PORT}|${APP_PORT})\\b" || true
fi

section "systemd service"
systemctl status "${SERVICE_NAME}.service" --no-pager -l || true

section "service logs"
journalctl -u "${SERVICE_NAME}.service" -n 120 --no-pager || true

section "nginx test"
nginx -t || true

section "nginx configs mentioning ports"
grep -R "3001\\|3002\\|personal-room\\|proxy_pass" /etc/nginx/sites-enabled /etc/nginx/sites-available 2>/dev/null || true

section "nginx recent errors"
tail -n 120 /var/log/nginx/error.log 2>/dev/null || true

cat <<EOF

Likely 502 causes:
1. Nginx listens on ${PUBLIC_PORT}, but Next.js is not running on ${APP_HOST}:${APP_PORT}.
2. The systemd service failed to start because .env.production still has placeholders.
3. Nginx proxy_pass points to the wrong port.
4. Cloud firewall allows ${PUBLIC_PORT}, but the internal app port is bound incorrectly.

Recommended fix command:
  cd /home/ubuntu/apps/personal-room
  PUBLIC_URL=${SITE_URL} PORT=${APP_PORT} BIND_HOST=${APP_HOST} ./deploy/install-or-update.sh
  sudo nginx -t && sudo systemctl reload nginx
  SITE_URL=${SITE_URL} STUDIO_PASSWORD="your studio password" ./deploy/healthcheck.sh
EOF

