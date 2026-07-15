# Everyday Plan API Usage

每日计划展示页：

```text
https://www.molforever.site/everyday_plan
```

页面保持隐藏导航和 `noindex`。公开读取、计划写入和待办勾选暂不要求鉴权；人工管理入口继续使用现有 Studio 登录。

## 写入当天计划

```text
POST https://www.molforever.site/api/everyday-plan
Content-Type: application/json
```

推荐请求体：

```json
{
  "date": "2026-07-15",
  "title": "把经验变成作品",
  "dayType": "Agent 深度任务日",
  "mostImportant": "完成一张可用于作品集的 Amazon SP 搜索词决策项目卡。",
  "focus": "今天只推进一个职业主线成果，并把英语分散到碎片时间和睡前。",
  "todo": [
    "背熟 6 个英语表达并完成中译英测试",
    "完成 Amazon SP 搜索词决策项目卡第一版",
    "完成阅读与听力任务",
    "录制两次英语口语"
  ],
  "blocks": [
    {
      "time": "上班碎片时间",
      "task": "词汇与纸质阅读"
    },
    {
      "time": "20:30 - 21:30",
      "task": "完成今日主要职业任务"
    }
  ],
  "detailMarkdown": "## 上班碎片时间\n\n完整计划正文……",
  "review": "",
  "source": "scheduled",
  "locked": false
}
```

- `date` 是唯一键，格式为 `YYYY-MM-DD`，缺省时按上海时区取当天日期。
- `todo` 建议只放 3—5 个核心完成项；具体步骤写入 `detailMarkdown`。
- `blocks` 用于前台的时间块速览。
- `detailMarkdown` 用于呈现词汇、阅读、听力、口语、晚间任务和复盘等完整内容。
- 公开 POST 会把来源归一化为 `scheduled`。同一天再次写入时，文本未改变的待办会保留完成状态。
- Studio 人工保存的计划可勾选 `locked`。被锁定后，定时写入同一天会返回 `409 EVERYDAY_PLAN_LOCKED`，防止人工计划被覆盖。
- 写入接口按来源 IP 限制为 10 分钟 20 次，以减少误刷；当前不要求 API token。

## 写入后验证

```text
GET https://www.molforever.site/api/everyday-plan
```

返回：

```json
{
  "plans": []
}
```

找到当天 `date`，并核对 `title`、`mostImportant`、`todo` 和 `detailMarkdown` 即表示上传成功。

## 勾选待办

页面使用以下接口保存完成状态：

```text
PATCH https://www.molforever.site/api/everyday-plan
Content-Type: application/json
```

```json
{
  "date": "2026-07-15",
  "todoId": "todo-0-example",
  "done": true
}
```

## 每天 7 点的自动任务要求

```text
每天早上 7 点，根据长期目标、最近完成情况、上海时区的当天日期和星期，生成一份现实可执行的中文每日计划，并写入个人网站。

要求：
1. date 使用当天日期，格式 YYYY-MM-DD。
2. title 是当天短主题；dayType 写深度任务日、健身日、恢复日或复盘日等定位。
3. mostImportant 只写一个可验收成果，focus 用一小段说明当天主线。
4. todo 只保留 3—5 个核心完成项。
5. blocks 给出 3—6 个与真实场景匹配的时间块。
6. detailMarkdown 放完整计划，包括 5—8 个英语表达、阅读、听力、口语、当天主要任务、最低完成版本和 3 个复盘问题。
7. source 使用 scheduled，locked 使用 false，review 初始为空字符串。
8. POST /api/everyday-plan 写入后，再用 GET 验证当天计划存在。
9. 如果返回 409，说明当天人工计划已锁定；保留人工计划，不强制覆盖。
```

## Studio 人工管理

登录 `/studio` 后打开“每日计划”，可以：

- 新建或编辑任意日期的计划；
- 增删和调整核心待办、时间块顺序；
- 编辑完整 Markdown 计划并实时预览；
- 锁定人工计划，避免自动任务覆盖；
- 删除不需要的计划。

Studio 使用现有后台会话保护。公开计划写入接口暂不做鉴权，后续访问量增加时再增加写入密钥。

## 错误说明

- `400 INVALID_EVERYDAY_PLAN`：计划为空或字段不可用。
- `409 EVERYDAY_PLAN_LOCKED`：当天人工计划已锁定。
- `429 TOO_MANY_REQUESTS`：短时间写入过多。
