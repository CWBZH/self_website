# Final Server Commands

Use these commands on the Ubuntu server when deploying the personal site beside the existing customer-agent site.

Assumed server:

```text
106.52.232.205
Ubuntu 22.04
```

Assumed app path:

```text
/home/ubuntu/apps/personal-room
```

## 1. Put the project on the server

From the server, use your preferred method to place this project at:

```text
/home/ubuntu/apps/personal-room
```

For example, clone or upload the project files there.

If you are deploying from the local Windows workspace without Git, create a release zip locally:

```powershell
cd C:\Users\Mr.Bin\Documents\Codex\2026-05-30\codexspark-codex5-5\magicuidesign-portfolio
npm run release:zip
```

Upload:

```text
release/personal-room-deploy.zip
```

to the server, then unpack:

```bash
mkdir -p /home/ubuntu/apps/personal-room
cd /home/ubuntu/apps
unzip -o personal-room-deploy.zip -d /home/ubuntu/apps/personal-room
cd /home/ubuntu/apps/personal-room
chmod +x deploy/*.sh
```

If `deploy/unpack-release.sh` is already available on the server, you can use:

```bash
APP_DIR=/home/ubuntu/apps/personal-room ./deploy/unpack-release.sh /path/to/personal-room-deploy.zip
```

## 2. Install dependencies

```bash
cd /home/ubuntu/apps/personal-room
npm ci
```

## 3. Generate Studio secrets

```bash
npm run studio:hash -- "replace-with-your-strong-password"
```

Copy the generated values.

## 4. Create production environment

```bash
cat > .env.production <<'EOF'
NEXT_PUBLIC_SITE_URL=http://106.52.232.205:3001
STUDIO_PASSWORD_HASH=replace-with-generated-hash
STUDIO_SESSION_SECRET=replace-with-generated-session-secret
STUDIO_COOKIE_SECURE=false
# PERSONAL_ROOM_DATABASE_URL=postgresql://personal_room:replace-password@127.0.0.1:5432/personal_room
EOF
```

Do not leave any `replace-with-*` value before deploying.

## 5. Optional PostgreSQL setup

Skip this for first trial if file storage is enough.

```bash
sudo -u postgres psql
```

```sql
create database personal_room;
create user personal_room with encrypted password 'replace-password';
grant all privileges on database personal_room to personal_room;
\c personal_room
grant all on schema public to personal_room;
\q
```

Apply schema:

```bash
psql "postgresql://personal_room:replace-password@127.0.0.1:5432/personal_room" \
  -f /home/ubuntu/apps/personal-room/deploy/personal-room.schema.sql
```

Then uncomment and fill `PERSONAL_ROOM_DATABASE_URL` in `.env.production`.

## 6. Install Nginx public port config

This keeps the existing port 80 customer-agent site untouched.

```bash
chmod +x deploy/*.sh
PUBLIC_PORT=3001 APP_HOST=127.0.0.1 APP_PORT=3002 \
  ./deploy/write-nginx-config.sh
```

## 7. Preflight

```bash
APP_DIR=/home/ubuntu/apps/personal-room PUBLIC_PORT=3001 APP_PORT=3002 \
  ./deploy/preflight.sh
```

## 8. Optional file-store backup before update

Run this before every redeploy if you are using the default file-store backend:

```bash
./deploy/backup-data.sh
```

## 9. Build and start service

```bash
PUBLIC_URL=http://106.52.232.205:3001 PORT=3002 BIND_HOST=127.0.0.1 \
  ./deploy/install-or-update.sh
```

## 10. Server health checks

```bash
curl -I http://127.0.0.1:3002/
curl -s http://127.0.0.1:3002/api/health
curl -I http://106.52.232.205:3001/
curl -s http://106.52.232.205:3001/api/health
```

Or run:

```bash
SITE_URL=http://106.52.232.205:3001 STUDIO_PASSWORD="replace-with-your-strong-password" \
  ./deploy/healthcheck.sh
```

If the public URL returns `502 Bad Gateway`, run:

```bash
SITE_URL=http://106.52.232.205:3001 PUBLIC_PORT=3001 APP_PORT=3002 APP_HOST=127.0.0.1 \
  ./deploy/diagnose-502.sh
```

To generate a report file for troubleshooting:

```bash
PUBLIC_URL=http://106.52.232.205:3001 APP_URL=http://127.0.0.1:3002 \
  ./deploy/status-report.sh
```

To apply the standard repair automatically:

```bash
PUBLIC_URL=http://106.52.232.205:3001 PUBLIC_PORT=3001 APP_PORT=3002 APP_HOST=127.0.0.1 \
  ./deploy/repair-502.sh
```

## 11. Full smoke test

```bash
SITE_URL=http://106.52.232.205:3001 STUDIO_PASSWORD="replace-with-your-strong-password" \
  npm run site:smoke
```

## 12. Public browser URLs

```text
http://106.52.232.205:3001
http://106.52.232.205:3001/journal
http://106.52.232.205:3001/notes
http://106.52.232.205:3001/room
http://106.52.232.205:3001/about
http://106.52.232.205:3001/studio
```
