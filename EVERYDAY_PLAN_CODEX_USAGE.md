# Everyday Plan Codex Usage

This endpoint lets Codex write one daily plan to the unlisted page:

```text
https://www.molforever.site/everyday_plan
```

The page is not linked from public navigation and is marked `noindex`. The page and API do not require a password or token, so anyone who knows the URL can read or overwrite a plan for a date.

No additional server environment variables are required.

## Write API

```text
POST https://www.molforever.site/api/everyday-plan
Content-Type: application/json
```

Request body:

```json
{
  "date": "2026-07-14",
  "title": "今日计划",
  "focus": "完成个人网站每日计划入口测试。",
  "blocks": [
    {
      "time": "07:30 - 08:00",
      "task": "确认今天最重要的三件事"
    },
    {
      "time": "09:00 - 11:00",
      "task": "完成主要写作或开发任务"
    }
  ],
  "todo": [
    "检查每日计划页面",
    "确认 API 写入成功",
    "晚上补充复盘"
  ],
  "review": ""
}
```

The `date` field is the unique key. Posting the same date again updates that day.

## curl test

```bash
curl -X POST https://www.molforever.site/api/everyday-plan \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-07-14",
    "title": "今日计划",
    "focus": "测试 Codex 写入每日计划。",
    "blocks": [
      {
        "time": "07:30 - 08:00",
        "task": "打开隐藏页面确认展示"
      }
    ],
    "todo": [
      "写入测试计划",
      "检查页面是否展示",
      "记录问题"
    ],
    "review": ""
  }'
```

Expected response:

```json
{
  "ok": true,
  "plan": {
    "date": "2026-07-14"
  }
}
```

## Read API for Codex verification

```bash
curl https://www.molforever.site/api/everyday-plan
```

Expected response:

```json
{
  "plans": []
}
```

## Task completion API

The page saves checkbox changes with this endpoint:

```text
PATCH https://www.molforever.site/api/everyday-plan
Content-Type: application/json
```

```json
{
  "date": "2026-07-14",
  "todoId": "todo-0-example",
  "done": true
}
```

Visitors normally do not need to call this endpoint manually. Existing plans that use a string array for `todo` are converted automatically when read. If Codex posts a new version for the same date, completion is preserved for tasks whose text is unchanged.

## Daily 7 AM Codex prompt

Use this prompt for the daily Codex automation:

```text
每天早上 7 点，根据我的长期目标、近期上下文和今天日期，生成一份中文每日计划，并调用我的个人网站 API 写入。

要求：
1. date 使用当天日期，格式 YYYY-MM-DD。
2. title 使用“今日计划”或更贴合当天主题的短标题。
3. focus 写 1 段今天最重要的主线，不超过 120 字。
4. blocks 给出 3-6 个时间块，格式如“07:30 - 08:00”。
5. todo 给出 5-10 个明确待办。
6. review 先留空字符串。
7. 用 POST https://www.molforever.site/api/everyday-plan 写入。
8. 不需要 Authorization 请求头或 API token。
9. 写入后用 GET /api/everyday-plan 验证最新计划是否存在。
```

## Troubleshooting

`400 INVALID_EVERYDAY_PLAN` means the request body is empty or has no usable focus, blocks, todo, or review.
