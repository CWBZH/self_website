# Personal Room Deployment

Target for first public stage:

```text
http://106.52.232.205:3001
```

Recommended server path:

```text
/home/ubuntu/apps/personal-room
```

## Environment

Create `/home/ubuntu/apps/personal-room/.env.production`:

```bash
NEXT_PUBLIC_SITE_URL=http://106.52.232.205:3001
STUDIO_PASSWORD_HASH=replace-with-generated-hash
STUDIO_SESSION_SECRET=replace-with-generated-secret
STUDIO_COOKIE_SECURE=false
PERSONAL_ROOM_DATABASE_URL=postgresql://personal_room:password@127.0.0.1:5432/personal_room
```

Generate Studio secrets locally or on the server:

```bash
npm run studio:hash -- "replace-with-a-strong-password"
```

If `PERSONAL_ROOM_DATABASE_URL` is omitted, comments and room messages are stored in:

```text
/home/ubuntu/apps/personal-room/data/personal-room.json
```

Use `STUDIO_COOKIE_SECURE=true` after switching to HTTPS.

## PostgreSQL

```bash
sudo -u postgres psql
```

```sql
create database personal_room;
create user personal_room with encrypted password 'replace-password';
grant all privileges on database personal_room to personal_room;
\c personal_room
grant all on schema public to personal_room;
```

Apply schema:

```bash
psql "postgresql://personal_room:replace-password@127.0.0.1:5432/personal_room" \
  -f /home/ubuntu/apps/personal-room/deploy/personal-room.schema.sql
```

The app also creates missing tables automatically on first API use.

## Build

```bash
cd /home/ubuntu/apps/personal-room
npm ci
npm run build
```

## Local release zip

From the Windows project directory:

```powershell
npm run release:zip
```

This creates:

```text
release/personal-room-deploy.zip
```

The package excludes:

- `node_modules`
- `.next`
- `.git`
- local `.env*`
- local `data`
- local `release`

Upload the zip to the server, then unpack into `/home/ubuntu/apps/personal-room`.

Or run:

```bash
bash deploy/install-or-update.sh
```

If Nginx listens on public `3001` and Next.js should only listen locally on
`3002`, run:

```bash
PUBLIC_URL=http://106.52.232.205:3001 PORT=3002 BIND_HOST=127.0.0.1 \
  bash deploy/install-or-update.sh
```

## Preflight

Before deployment:

```bash
chmod +x deploy/*.sh
APP_DIR=/home/ubuntu/apps/personal-room PUBLIC_PORT=3001 APP_PORT=3002 \
  ./deploy/preflight.sh
```

## Backup

When using file storage, back up comments and room messages before redeploying:

```bash
./deploy/backup-data.sh
```

Restore:

```bash
./deploy/restore-data.sh /home/ubuntu/apps/personal-room/backups/personal-room-YYYYMMDDTHHMMSSZ.json
sudo systemctl restart personal-room.service
```

## systemd

```bash
sudo cp deploy/personal-room.service /etc/systemd/system/personal-room.service
sudo systemctl daemon-reload
sudo systemctl enable --now personal-room.service
sudo systemctl status personal-room.service --no-pager -l
```

## Nginx

For IP-only first stage, you can expose the Next.js app directly on `3001`.

If you want Nginx in front, do not use `deploy/nginx-personal-room.conf` as-is while the app also listens on `3001`; change Nginx to listen on a different public port or bind Next.js to an internal port.

Recommended IP-only Nginx setup:

```bash
PUBLIC_PORT=3001 APP_HOST=127.0.0.1 APP_PORT=3002 \
  ./deploy/write-nginx-config.sh
```

Recommended later with domain:

```text
server_name your-domain.com;
listen 80;
proxy_pass http://127.0.0.1:3001;
```

## Health Check

```bash
curl -I http://127.0.0.1:3001/
curl -s http://127.0.0.1:3001/api/room/messages
curl -s "http://127.0.0.1:3001/api/comments?postType=journal&postSlug=personal-digital-room"
```

Full health check:

```bash
SITE_URL=http://106.52.232.205:3001 STUDIO_PASSWORD="your studio password" \
  ./deploy/healthcheck.sh
```

See also:

```text
deploy/OPERATIONS.md
```

## Diagnose 502

If `http://106.52.232.205:3001` returns `502 Bad Gateway`:

```bash
SITE_URL=http://106.52.232.205:3001 PUBLIC_PORT=3001 APP_PORT=3002 APP_HOST=127.0.0.1 \
  ./deploy/diagnose-502.sh
```

Standard repair:

```bash
PUBLIC_URL=http://106.52.232.205:3001 PUBLIC_PORT=3001 APP_PORT=3002 APP_HOST=127.0.0.1 \
  ./deploy/repair-502.sh
```

Status report:

```bash
PUBLIC_URL=http://106.52.232.205:3001 APP_URL=http://127.0.0.1:3002 \
  ./deploy/status-report.sh
```
