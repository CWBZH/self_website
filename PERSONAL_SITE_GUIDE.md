# 个人博客与聊天室网站使用手册

这个项目现在按“个人数字客厅”来组织：

- 公开首页：图片入口、文章、随笔、聊天室、关于页。
- 半隐藏入口：页脚小句号进入 `/garden`。
- 内容系统：MDX 文件维护文章、随笔、隐藏随笔。
- 互动系统：评论区、聊天室、站长后台。
- 管理后台：`/studio`，用于隐藏/删除评论和聊天室消息。

## 1. 本地启动

进入项目目录：

```powershell
cd C:\Users\Mr.Bin\Documents\Codex\2026-05-30\codexspark-codex5-5\magicuidesign-portfolio
```

安装依赖：

```powershell
npm install
```

启动开发服务：

```powershell
npm run dev -- --port 3001
```

浏览器打开：

```text
http://localhost:3001
```

## 2. 主要页面

```text
/              首页
/journal       长文章
/notes         短随笔
/room          聊天室
/about         关于和联系方式
/garden        半隐藏随笔入口
/studio        站长后台
```

## 3. 半隐藏入口在哪里

半隐藏入口放在页脚的小句号上。

访问方式：

```text
页面底部的小句号 -> /garden
```

设计逻辑：

- 不是完全加密空间。
- 不出现在主导航。
- 不进入 sitemap。
- robots 标记为不建议搜索引擎索引。
- 适合放不想公开陈列、但愿意被发现的随笔和图片记录。

如果以后你想进一步隐藏，可以加：

- 简单口令页。
- 私密 token 链接。
- 管理后台控制可见性。

## 4. 如何写文章、随笔和隐藏内容

内容放在：

```text
content/
```

每篇内容是一个 `.mdx` 文件。

公开长文章示例：

```mdx
---
title: "我的第一篇长文章"
description: "这是一篇正式文章。"
date: "2026-05-31"
type: "journal"
visibility: "public"
cover: "/images/paper-window.svg"
tags: ["个人网站", "写作"]
readingTime: "4 min"
---

这里写正文。

![图片说明](/images/paper-window.svg)
```

公开短随笔示例：

```mdx
---
title: "一个短想法"
description: "短随笔摘要。"
date: "2026-05-31"
type: "note"
visibility: "public"
cover: "/images/paper-window.svg"
tags: ["notes"]
readingTime: "1 min"
---

短内容正文。
```

隐藏花园内容示例：

```mdx
---
title: "不放在首页的随笔"
description: "只从小句号入口进入。"
date: "2026-05-31"
type: "garden"
visibility: "garden"
cover: "/images/paper-window.svg"
tags: ["private", "garden"]
readingTime: "2 min"
---

这里可以写文字，也可以放图片。

![一张图](/images/paper-window.svg)
```

图片建议放在：

```text
public/images/
```

引用路径写：

```md
![图片说明](/images/your-image.jpg)
```

## 5. 评论区如何工作

文章详情页底部有评论区。

访客可以填写：

- 昵称
- 评论内容
- 回复其他评论
- 点赞
- 删除自己发表的评论

系统会记录：

- 文章 slug
- 评论时间
- 昵称
- 内容
- 父评论 ID
- 点赞数
- 状态

默认评论会显示在文章下方。

站长可以到：

```text
/studio
```

执行：

- 隐藏评论
- 删除评论
- 查看评论来源页面

## 6. 聊天室如何工作

聊天室页面：

```text
/room
```

当前版本是轻量实时聊天室：

- 访客昵称
- 消息发送
- 时间戳
- 在线人数
- 在线成员列表
- SSE 事件流实时刷新
- 事件流失败时定时拉取兜底
- 定时刷新在线状态
- 基础频率限制

站长可以在：

```text
/studio
```

管理聊天室消息：

- 隐藏消息
- 删除消息

当前聊天室不是复杂社交系统，不包含：

- 私聊
- 好友系统
- 多房间
- 强账号体系
- WebSocket 长连接，当前使用 SSE

## 7. 站长后台登录

后台地址：

```text
/studio
```

本地开发默认密码：

```text
studio
```

生产环境必须配置：

```env
STUDIO_PASSWORD=换成你的强密码
STUDIO_SESSION_SECRET=换成一串很长的随机字符串
```

更推荐生产环境使用密码哈希：

```env
STUDIO_PASSWORD_HASH=你的哈希值
```

不要把真实密码、token、API key 提交到代码里。

## 8. 数据存在哪里

默认本地文件存储：

```text
data/personal-room.json
```

这个目录已被忽略，不应该提交。

生产环境建议使用 PostgreSQL：

```env
PERSONAL_ROOM_DATABASE_URL=postgresql://user:password@127.0.0.1:5432/personal_room
```

对应建表 SQL：

```text
deploy/personal-room.schema.sql
```

## 9. 只有服务器 IP 时怎么部署

你当前服务器已有一个网站占用 80 端口。

因此第一阶段不要抢占：

```text
http://106.52.232.205/
```

建议先部署到独立端口：

```text
http://106.52.232.205:3001
```

这样不会影响原来的客服后台。

以后有域名后，再切换到：

```text
https://your-domain.com
```

## 10. 服务器部署方式

上传项目到服务器后：

```bash
cd /home/ubuntu/apps/magicuidesign-portfolio
cp .env.example .env.production
nano .env.production
```

必须修改：

```env
NEXT_PUBLIC_SITE_URL=http://106.52.232.205:3001
STUDIO_PASSWORD=你的后台密码
STUDIO_SESSION_SECRET=一串很长的随机字符串
STUDIO_COOKIE_SECURE=false
```

执行部署：

```bash
chmod +x deploy/install-or-update.sh
PORT=3001 ./deploy/install-or-update.sh
```

如果使用 PostgreSQL，先执行：

```bash
psql "$PERSONAL_ROOM_DATABASE_URL" -f deploy/personal-room.schema.sql
```

## 11. 与原网站共存的推荐方式

当前阶段：

```text
原客服后台： http://106.52.232.205/
个人网站：   http://106.52.232.205:3001/
```

有域名后：

```text
原客服后台： http://106.52.232.205/
个人网站：   https://blog.your-domain.com/
```

如果一定要放在同一个 IP 的路径下，例如：

```text
http://106.52.232.205/me
```

需要额外配置 Next.js `basePath`，这比独立端口或独立域名更麻烦，不建议第一阶段使用。

## 12. 后续优先级

第一优先级：

- 确认首页视觉是否满意。
- 补 5 到 10 篇真实 MDX 内容。
- 换掉示例图片。
- 设置生产后台密码。
- 部署到服务器独立端口。

第二优先级：

- PostgreSQL 持久化。
- 评论审核状态。
- 聊天室 WebSocket。
- 后台内容统计。
- 免费域名或正式域名接入。

第三优先级：

- 登录用户体系。
- 图片上传后台。
- 全文搜索。
- RSS。
- 邮件通知。
