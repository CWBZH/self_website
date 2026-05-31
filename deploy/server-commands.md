# Server Commands

These commands assume the first-stage IP deployment:

```text
http://106.52.232.205:3001
```

## Upload/Update Code

From your server:

```bash
mkdir -p /home/ubuntu/apps
cd /home/ubuntu/apps

# If using git:
git clone <your-repo-url> personal-room
cd personal-room

# Or if you upload a zip/tarball, extract it to:
# /home/ubuntu/apps/personal-room
```

## Environment

```bash
cd /home/ubuntu/apps/personal-room
cp .env.example .env.production
nano .env.production
```

Minimum production values:

```bash
NEXT_PUBLIC_SITE_URL=http://106.52.232.205:3001
STUDIO_PASSWORD=<strong-password>
STUDIO_SESSION_SECRET=<long-random-secret>
STUDIO_COOKIE_SECURE=false
```

Optional PostgreSQL:

```bash
PERSONAL_ROOM_DATABASE_URL=postgresql://personal_room:<password>@127.0.0.1:5432/personal_room
```

## PostgreSQL Setup

```bash
sudo -u postgres psql
```

```sql
create database personal_room;
create user personal_room with encrypted password '<password>';
grant all privileges on database personal_room to personal_room;
\c personal_room
grant all on schema public to personal_room;
\q
```

Apply schema:

```bash
psql "postgresql://personal_room:<password>@127.0.0.1:5432/personal_room" \
  -f /home/ubuntu/apps/personal-room/deploy/personal-room.schema.sql
```

## Deploy

```bash
cd /home/ubuntu/apps/personal-room
bash deploy/install-or-update.sh
```

## Health Checks

```bash
curl -s http://127.0.0.1:3001/api/health
curl -I http://127.0.0.1:3001/
curl -I http://127.0.0.1:3001/room
curl -I http://127.0.0.1:3001/garden
sudo systemctl status personal-room --no-pager -l
```

## Public Firewall

If the server firewall is active:

```bash
sudo ufw allow 3001/tcp
```
