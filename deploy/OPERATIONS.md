# Operations Guide

This guide covers the first public stage where the personal site runs beside the existing customer-agent site.

## Target runtime

```text
Public URL: http://106.52.232.205:3001
Nginx:      0.0.0.0:3001
Next.js:    127.0.0.1:3002
Service:    personal-room.service
App path:   /home/ubuntu/apps/personal-room
```

## Preflight

Run before deployment:

```bash
cd /home/ubuntu/apps/personal-room
chmod +x deploy/*.sh
APP_DIR=/home/ubuntu/apps/personal-room PUBLIC_PORT=3001 APP_PORT=3002 \
  ./deploy/preflight.sh
```

Preflight checks:

- app directory
- Node.js and npm
- Nginx availability
- systemd availability
- `.env.production`
- missing or placeholder Studio secrets
- public and internal port status
- service name conflict

## Deploy

```bash
cd /home/ubuntu/apps/personal-room
PUBLIC_URL=http://106.52.232.205:3001 PORT=3002 BIND_HOST=127.0.0.1 \
  ./deploy/install-or-update.sh
```

## Health check

Local service check:

```bash
SITE_URL=http://127.0.0.1:3002 ./deploy/healthcheck.sh
```

Public check:

```bash
SITE_URL=http://106.52.232.205:3001 STUDIO_PASSWORD="your studio password" \
  ./deploy/healthcheck.sh
```

The health check also verifies the room SSE endpoint:

```text
/api/room/events?roomId=main
```

## Logs

```bash
sudo systemctl status personal-room.service --no-pager -l
sudo journalctl -u personal-room.service -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
```

Generate a single report file:

```bash
PUBLIC_URL=http://106.52.232.205:3001 APP_URL=http://127.0.0.1:3002 \
  ./deploy/status-report.sh
```

## Restart

```bash
sudo systemctl restart personal-room.service
sudo systemctl reload nginx
```

## Backup file-store data

If `PERSONAL_ROOM_DATABASE_URL` is not configured, comments and room messages are stored in:

```text
/home/ubuntu/apps/personal-room/data/personal-room.json
```

Create a backup:

```bash
./deploy/backup-data.sh
```

Restore from a backup:

```bash
./deploy/restore-data.sh /home/ubuntu/apps/personal-room/backups/personal-room-YYYYMMDDTHHMMSSZ.json
sudo systemctl restart personal-room.service
```

## PostgreSQL mode

If `PERSONAL_ROOM_DATABASE_URL` is configured, file-store backup scripts are not enough. Use `pg_dump`:

```bash
pg_dump "$PERSONAL_ROOM_DATABASE_URL" > personal-room.sql
```

Restore:

```bash
psql "$PERSONAL_ROOM_DATABASE_URL" < personal-room.sql
```

## Common failures

Public URL returns `502 Bad Gateway`:

```bash
SITE_URL=http://106.52.232.205:3001 PUBLIC_PORT=3001 APP_PORT=3002 APP_HOST=127.0.0.1 \
  ./deploy/diagnose-502.sh
```

If the diagnosis confirms Nginx is up but the internal app is not healthy, apply the standard repair:

```bash
PUBLIC_URL=http://106.52.232.205:3001 PUBLIC_PORT=3001 APP_PORT=3002 APP_HOST=127.0.0.1 \
  ./deploy/repair-502.sh
```

If you only need to rewrite the Nginx proxy config:

```bash
PUBLIC_PORT=3001 APP_HOST=127.0.0.1 APP_PORT=3002 \
  ./deploy/write-nginx-config.sh
```

The current observed state from local checking was:

```text
http://106.52.232.205:3001/api/health -> 502 Bad Gateway
```

That usually means Nginx is reachable on the public port, but the upstream app is not responding.

`/studio` cannot log in:

- Check `STUDIO_PASSWORD_HASH`.
- Check `STUDIO_SESSION_SECRET`.
- If using only IP over HTTP, keep `STUDIO_COOKIE_SECURE=false`.

Public URL does not open:

- Check cloud security group allows TCP `3001`.
- Check `sudo nginx -t`.
- Check `sudo systemctl status nginx`.
- Check Nginx config points to `127.0.0.1:3002`.

Local service does not respond:

- Check `sudo systemctl status personal-room.service --no-pager -l`.
- Check `sudo journalctl -u personal-room.service -n 100 --no-pager`.
- Check `.env.production` has no placeholder values.

Comments or room messages are lost after restart:

- If using file-store, confirm `/home/ubuntu/apps/personal-room/data` is writable by the service user.
- If using PostgreSQL, confirm `PERSONAL_ROOM_DATABASE_URL` is present in `.env.production`.
