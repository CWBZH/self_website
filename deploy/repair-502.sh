#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/apps/personal-room}"
SERVICE_NAME="${SERVICE_NAME:-personal-room}"
PUBLIC_URL="${PUBLIC_URL:-http://106.52.232.205:3001}"
PUBLIC_PORT="${PUBLIC_PORT:-3001}"
APP_PORT="${APP_PORT:-3002}"
APP_HOST="${APP_HOST:-127.0.0.1}"

cd "$APP_DIR"

printf 'Repairing Personal Room 502\n'
printf 'APP_DIR=%s\n' "$APP_DIR"
printf 'SERVICE_NAME=%s\n' "$SERVICE_NAME"
printf 'PUBLIC_URL=%s\n' "$PUBLIC_URL"
printf 'PUBLIC_PORT=%s\n' "$PUBLIC_PORT"
printf 'APP_HOST=%s\n' "$APP_HOST"
printf 'APP_PORT=%s\n' "$APP_PORT"

if [ ! -f ".env.production" ]; then
  cat > .env.production <<EOF
NEXT_PUBLIC_SITE_URL=${PUBLIC_URL}
STUDIO_PASSWORD_HASH=replace-with-generated-hash
STUDIO_SESSION_SECRET=replace-with-generated-session-secret
STUDIO_COOKIE_SECURE=false
# PERSONAL_ROOM_DATABASE_URL=postgresql://personal_room:password@127.0.0.1:5432/personal_room
EOF

  cat <<EOF

Created .env.production with placeholders.
Generate real Studio secrets before continuing:

  npm run studio:hash -- "your strong password"

Then edit .env.production and re-run this script.
EOF
  exit 1
fi

if grep -q 'change-me\|replace-with' .env.production; then
  cat <<EOF >&2
Refusing to repair while .env.production contains placeholder values.

Generate real Studio secrets:
  npm run studio:hash -- "your strong password"

Then edit:
  ${APP_DIR}/.env.production
EOF
  exit 1
fi

chmod +x deploy/*.sh

printf '\n[1/6] Preflight\n'
APP_DIR="$APP_DIR" SERVICE_NAME="$SERVICE_NAME" PUBLIC_PORT="$PUBLIC_PORT" APP_PORT="$APP_PORT" \
  ./deploy/preflight.sh

printf '\n[2/6] Installing Nginx config for public port %s\n' "$PUBLIC_PORT"
PUBLIC_PORT="$PUBLIC_PORT" APP_HOST="$APP_HOST" APP_PORT="$APP_PORT" \
  ./deploy/write-nginx-config.sh

printf '\n[3/6] Optional file-store backup\n'
./deploy/backup-data.sh || true

printf '\n[4/6] Build and restart service\n'
PUBLIC_URL="$PUBLIC_URL" PORT="$APP_PORT" BIND_HOST="$APP_HOST" SERVICE_NAME="$SERVICE_NAME" APP_DIR="$APP_DIR" \
  ./deploy/install-or-update.sh

printf '\n[5/6] Local health check\n'
SITE_URL="http://${APP_HOST}:${APP_PORT}" ./deploy/healthcheck.sh

printf '\n[6/6] Public health check\n'
SITE_URL="$PUBLIC_URL" ./deploy/healthcheck.sh

cat <<EOF

Repair complete.

Open:
  ${PUBLIC_URL}
  ${PUBLIC_URL}/room
  ${PUBLIC_URL}/studio

For full Studio smoke test:
  SITE_URL=${PUBLIC_URL} STUDIO_PASSWORD="your studio password" ./deploy/healthcheck.sh
EOF
