# 上线检查清单

目标：先把个人博客与聊天室作为独立站点部署，不影响原来的客服后台。

## 1. 本地检查

项目目录：

```powershell
cd C:\Users\Mr.Bin\Documents\Codex\2026-05-30\codexspark-codex5-5\magicuidesign-portfolio
```

建议在本地确认：

```powershell
npm install
npm run build
npm run dev -- --port 3001
```

打开：

```text
http://localhost:3001
```

重点看：

- 首页图片入口是否符合你的审美。
- `/journal` 和 `/notes` 是否能进入文章。
- 页脚小句号是否能进入 `/garden`。
- `/room` 是否能发送消息。
- `/room` 是否显示在线人数和在线成员。
- 文章底部评论是否能提交、回复、点赞、自删。
- `/studio` 是否能登录并管理评论和消息。

## 2. 生产密码

不要在生产环境使用默认密码。

生成后台密码哈希：

```powershell
npm run studio:hash -- "你的强密码"
```

会输出：

```env
STUDIO_PASSWORD_HASH=...
STUDIO_SESSION_SECRET=...
```

生产环境推荐只写：

```env
STUDIO_PASSWORD_HASH=生成出来的值
STUDIO_SESSION_SECRET=生成出来的值
```

可以不写：

```env
STUDIO_PASSWORD=
```

## 3. 服务器第一阶段部署

因为原客服后台已经占用 80 端口，个人网站先使用：

```text
http://106.52.232.205:3001
```

推荐结构：

```text
公网 3001 -> Nginx -> 127.0.0.1:3002 -> Next.js
```

Next.js 环境变量：

```env
NEXT_PUBLIC_SITE_URL=http://106.52.232.205:3001
STUDIO_PASSWORD_HASH=你的哈希
STUDIO_SESSION_SECRET=你的随机密钥
STUDIO_COOKIE_SECURE=false
```

部署命令：

```bash
cd /home/ubuntu/apps/magicuidesign-portfolio
cp .env.example .env.production
nano .env.production
PUBLIC_URL=http://106.52.232.205:3001 PORT=3002 BIND_HOST=127.0.0.1 \
  ./deploy/install-or-update.sh
```

如果你不想在服务器上用 Git，可以先在本地打包：

```powershell
npm run release:zip
```

上传：

```text
release/personal-room-deploy.zip
```

到服务器后解压到：

```text
/home/ubuntu/apps/personal-room
```

Nginx 可参考：

```text
deploy/nginx-personal-room-ip-port.conf
```

## 4. 数据库选择

第一阶段可以用文件存储：

```text
data/personal-room.json
```

这适合小流量、个人站、试运行。

正式长期运行建议切 PostgreSQL：

```env
PERSONAL_ROOM_DATABASE_URL=postgresql://user:password@127.0.0.1:5432/personal_room
```

建表：

```bash
psql "$PERSONAL_ROOM_DATABASE_URL" -f deploy/personal-room.schema.sql
```

## 5. 上线后检查

上线前预检：

```bash
APP_DIR=/home/ubuntu/apps/personal-room PUBLIC_PORT=3001 APP_PORT=3002 \
  ./deploy/preflight.sh
```

如果使用默认文件存储，部署前备份：

```bash
./deploy/backup-data.sh
```

服务器本机检查：

```bash
curl -I http://127.0.0.1:3002/
curl -s http://127.0.0.1:3002/api/health
```

公网检查：

```bash
curl -I http://106.52.232.205:3001/
curl -s http://106.52.232.205:3001/api/health
```

浏览器检查：

```text
http://106.52.232.205:3001
http://106.52.232.205:3001/room
http://106.52.232.205:3001/studio
```

一键接口检查：

```bash
SITE_URL=http://106.52.232.205:3001 STUDIO_PASSWORD="你的后台密码" npm run site:smoke
```

或使用部署脚本封装：

```bash
SITE_URL=http://106.52.232.205:3001 STUDIO_PASSWORD="你的后台密码" \
  ./deploy/healthcheck.sh
```

如果生产环境只配置了 `STUDIO_PASSWORD_HASH`，这里的 `STUDIO_PASSWORD` 仍然填写真实后台密码，用于登录测试，不会写入项目文件。

## 6. 不能上线的情况

以下情况不要上线：

- `.env.production` 里还有 `change-me`。
- `STUDIO_SESSION_SECRET` 太短。
- `/studio` 仍然使用默认密码。
- 服务器安全组没有放行 3001。
- Nginx 代理端口和 systemd 服务端口不一致。
- 评论或聊天室数据目录没有写入权限。
- `http://106.52.232.205:3001/api/health` 返回 `502 Bad Gateway`。

502 诊断：

```bash
SITE_URL=http://106.52.232.205:3001 PUBLIC_PORT=3001 APP_PORT=3002 APP_HOST=127.0.0.1 \
  ./deploy/diagnose-502.sh
```

标准修复：

```bash
PUBLIC_URL=http://106.52.232.205:3001 PUBLIC_PORT=3001 APP_PORT=3002 APP_HOST=127.0.0.1 \
  ./deploy/repair-502.sh
```

如果需要把服务器诊断信息打包成一个文本报告：

```bash
PUBLIC_URL=http://106.52.232.205:3001 APP_URL=http://127.0.0.1:3002 \
  ./deploy/status-report.sh
```

## 7. 后续有域名后的切换

有域名后再改：

```env
NEXT_PUBLIC_SITE_URL=https://你的域名
STUDIO_COOKIE_SECURE=true
```

Nginx 改为 80/443，并使用 HTTPS。
