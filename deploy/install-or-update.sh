#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/apps/personal-room}"
SERVICE_NAME="${SERVICE_NAME:-personal-room}"
PORT="${PORT:-3001}"
BIND_HOST="${BIND_HOST:-0.0.0.0}"
PUBLIC_URL="${PUBLIC_URL:-http://106.52.232.205:${PORT}}"

cd "$APP_DIR"

if [ ! -f ".env.production" ]; then
  cat > .env.production <<EOF
NEXT_PUBLIC_SITE_URL=${PUBLIC_URL}
STUDIO_PASSWORD_HASH=change-me-generated-hash
STUDIO_SESSION_SECRET=change-me-generated-session-secret
STUDIO_COOKIE_SECURE=false
# PERSONAL_ROOM_DATABASE_URL=postgresql://personal_room:password@127.0.0.1:5432/personal_room
EOF
  echo "Created .env.production. Edit it before public use."
fi

if grep -q "change-me" .env.production; then
  echo "Refusing to deploy with placeholder Studio secrets in .env.production." >&2
  echo "Generate STUDIO_PASSWORD_HASH and STUDIO_SESSION_SECRET first:" >&2
  echo "npm run studio:hash -- \"your strong password\"" >&2
  exit 1
fi

npm ci
npm run build

sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" >/dev/null <<EOF
[Unit]
Description=Personal Room Next.js site
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env.production
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start -- --hostname ${BIND_HOST} --port ${PORT}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now "${SERVICE_NAME}.service"
sudo systemctl restart "${SERVICE_NAME}.service"

sleep 2
sudo systemctl status "${SERVICE_NAME}.service" --no-pager -l
curl -I "http://127.0.0.1:${PORT}/"
