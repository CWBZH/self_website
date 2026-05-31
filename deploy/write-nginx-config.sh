#!/usr/bin/env bash
set -euo pipefail

PUBLIC_PORT="${PUBLIC_PORT:-3001}"
APP_HOST="${APP_HOST:-127.0.0.1}"
APP_PORT="${APP_PORT:-3002}"
CONFIG_NAME="${CONFIG_NAME:-personal-room-ip-port.conf}"
AVAILABLE_PATH="/etc/nginx/sites-available/${CONFIG_NAME}"
ENABLED_PATH="/etc/nginx/sites-enabled/${CONFIG_NAME}"

sudo tee "$AVAILABLE_PATH" >/dev/null <<EOF
server {
    listen 0.0.0.0:${PUBLIC_PORT};
    server_name _;

    client_max_body_size 10m;

    location / {
        proxy_pass http://${APP_HOST}:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;
    }
}
EOF

sudo ln -sf "$AVAILABLE_PATH" "$ENABLED_PATH"
sudo nginx -t
sudo systemctl reload nginx

printf 'Nginx config written: %s\n' "$AVAILABLE_PATH"
printf 'Public port %s -> %s:%s\n' "$PUBLIC_PORT" "$APP_HOST" "$APP_PORT"

