"use client";

import { useEffect, useMemo, useState } from "react";

type StudioComment = {
  id: string;
  postType: string;
  postSlug: string;
  nickname: string;
  content: string;
  status: "visible" | "hidden" | "deleted";
  createdAt: string;
};

type StudioMessage = {
  id: string;
  nickname: string;
  content: string;
  status: "visible" | "hidden" | "deleted";
  createdAt: string;
};

type StudioPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  cover?: string;
  image?: string;
  type: "journal" | "note" | "garden";
  visibility: "public" | "garden";
  status: "draft" | "published";
  tags: string[];
  readingTime?: string;
  publishedAt: string;
  updatedAt?: string;
  createdAt: string;
};

type PostForm = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover: string;
  type: "journal" | "note" | "garden";
  visibility: "public" | "garden";
  status: "draft" | "published";
  tags: string;
  readingTime: string;
  publishedAt: string;
};

const emptyForm: PostForm = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  cover: "",
  type: "journal",
  visibility: "public",
  status: "draft",
  tags: "",
  readingTime: "",
  publishedAt: new Date().toISOString(),
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function postToForm(post: StudioPost): PostForm {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    content: post.content,
    cover: post.cover ?? post.image ?? "",
    type: post.type,
    visibility: post.visibility,
    status: post.status,
    tags: post.tags.join(", "),
    readingTime: post.readingTime ?? "",
    publishedAt: post.publishedAt,
  };
}

function formToPayload(form: PostForm, status?: "draft" | "published") {
  return {
    title: form.title,
    slug: form.slug,
    summary: form.summary,
    content: form.content,
    cover: form.cover,
    type: form.type,
    visibility: form.type === "garden" ? "garden" : form.visibility,
    status: status ?? form.status,
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    readingTime: form.readingTime,
    publishedAt: form.publishedAt,
  };
}

export function StudioDashboard() {
  const [posts, setPosts] = useState<StudioPost[]>([]);
  const [comments, setComments] = useState<StudioComment[]>([]);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [activeTab, setActiveTab] = useState<"posts" | "comments" | "room">("posts");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === form.id) ?? null,
    [form.id, posts]
  );

  async function loadStudioData() {
    const [postsResponse, commentsResponse, messagesResponse] = await Promise.all([
      fetch("/api/studio/posts"),
      fetch("/api/studio/comments"),
      fetch("/api/studio/messages"),
    ]);

    if (postsResponse.ok) {
      const data = (await postsResponse.json()) as { posts?: StudioPost[] };
      setPosts(data.posts ?? []);
    }

    if (commentsResponse.ok) {
      const data = (await commentsResponse.json()) as { comments?: StudioComment[] };
      setComments(data.comments ?? []);
    }

    if (messagesResponse.ok) {
      const data = (await messagesResponse.json()) as { messages?: StudioMessage[] };
      setMessages(data.messages ?? []);
    }
  }

  useEffect(() => {
    loadStudioData().catch(() => setStatus("后台数据加载失败，请重新登录或刷新页面。"));
  }, []);

  function updateForm<K extends keyof PostForm>(key: K, value: PostForm[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "type" && value === "garden") {
        next.visibility = "garden";
      }
      return next;
    });
  }

  function newPost(type: PostForm["type"] = "journal") {
    setForm({
      ...emptyForm,
      type,
      visibility: type === "garden" ? "garden" : "public",
      publishedAt: new Date().toISOString(),
    });
    setActiveTab("posts");
    setStatus("已开始一篇新内容。先保存草稿，确认后再发布。");
  }

  async function savePost(nextStatus?: "draft" | "published") {
    if (!form.title.trim()) {
      setStatus("标题不能为空。每篇内容至少需要一个标题。 ");
      return;
    }

    setIsSaving(true);
    setStatus("");

    try {
      const endpoint = form.id
        ? `/api/studio/posts/${encodeURIComponent(form.id)}`
        : "/api/studio/posts";
      const response = await fetch(endpoint, {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form, nextStatus)),
      });

      if (!response.ok) {
        setStatus("保存失败，请检查字段后重试。");
        return;
      }

      const data = (await response.json()) as { post?: StudioPost };
      if (data.post) {
        setForm(postToForm(data.post));
        await loadStudioData();
        setStatus(data.post.status === "published" ? "已发布，前台会立即显示。" : "草稿已保存。 ");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm("确定删除这篇内容吗？删除后不可从后台恢复。")) return;

    const response = await fetch(`/api/studio/posts/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setStatus("删除失败。");
      return;
    }

    setForm(emptyForm);
    await loadStudioData();
    setStatus("内容已删除。 ");
  }

  async function uploadCover(file: File | null) {
    if (!file) return;

    const body = new FormData();
    body.append("file", file);
    setIsUploading(true);

    try {
      const response = await fetch("/api/studio/uploads", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setStatus(data.error === "FILE_TOO_LARGE" ? "图片不能超过 5MB。" : "图片上传失败。 ");
        return;
      }

      updateForm("cover", data.url);
      setStatus("封面已上传。 ");
    } finally {
      setIsUploading(false);
    }
  }

  async function updateCommentStatus(id: string, nextStatus: StudioComment["status"]) {
    await fetch(`/api/studio/comments/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadStudioData();
  }

  async function updateMessageStatus(id: string, nextStatus: StudioMessage["status"]) {
    await fetch(`/api/studio/messages/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadStudioData();
  }

  async function logout() {
    await fetch("/api/studio/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Studio
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight md:text-6xl">
            内容运营后台
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            在这里新增文章、短随笔和半隐藏花园内容；评论和聊天室消息也在这里管理。
          </p>
        </div>
        <button
          className="rounded-full border border-border px-4 py-2 text-sm transition hover:bg-muted"
          onClick={logout}
          type="button"
        >
          退出登录
        </button>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          ["posts", `内容 ${posts.length}`],
          ["comments", `评论 ${comments.length}`],
          ["room", `聊天室 ${messages.length}`],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              activeTab === key
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:bg-muted"
            }`}
            onClick={() => setActiveTab(key as typeof activeTab)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {status ? (
        <div className="mb-6 rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          {status}
        </div>
      ) : null}

      {activeTab === "posts" ? (
        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-3xl border border-border p-4">
            <div className="mb-4 grid grid-cols-3 gap-2">
              <button className="rounded-full bg-foreground px-3 py-2 text-xs text-background" onClick={() => newPost("journal")} type="button">
                新文章
              </button>
              <button className="rounded-full bg-foreground px-3 py-2 text-xs text-background" onClick={() => newPost("note")} type="button">
                新随笔
              </button>
              <button className="rounded-full bg-foreground px-3 py-2 text-xs text-background" onClick={() => newPost("garden")} type="button">
                新花园
              </button>
            </div>
            <div className="grid max-h-[72vh] gap-2 overflow-y-auto pr-1">
              {posts.map((post) => (
                <button
                  key={post.id}
                  className={`rounded-2xl border p-4 text-left transition hover:bg-muted ${
                    selectedPost?.id === post.id ? "border-foreground" : "border-border"
                  }`}
                  onClick={() => setForm(postToForm(post))}
                  type="button"
                >
                  <div className="mb-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    <span>{post.type}</span>
                    <span>{post.status === "published" ? "已发布" : "草稿"}</span>
                  </div>
                  <strong className="line-clamp-2 text-sm font-medium">{post.title}</strong>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {post.summary || "还没有摘要"}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <form
            className="grid gap-5 rounded-3xl border border-border p-5"
            onSubmit={(event) => {
              event.preventDefault();
              savePost();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                标题
                <input className="rounded-xl border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="例如：一间数字客厅" />
              </label>
              <label className="grid gap-2 text-sm">
                URL Slug
                <input className="rounded-xl border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} placeholder="digital-room" />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <label className="grid gap-2 text-sm">
                栏目
                <select className="rounded-xl border border-border bg-background px-3 py-2" value={form.type} onChange={(event) => updateForm("type", event.target.value as PostForm["type"])}>
                  <option value="journal">Journal 长文章</option>
                  <option value="note">Notes 短随笔</option>
                  <option value="garden">Garden 半隐藏</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                可见性
                <select className="rounded-xl border border-border bg-background px-3 py-2" value={form.visibility} disabled={form.type === "garden"} onChange={(event) => updateForm("visibility", event.target.value as PostForm["visibility"])}>
                  <option value="public">公开</option>
                  <option value="garden">半隐藏花园</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                状态
                <select className="rounded-xl border border-border bg-background px-3 py-2" value={form.status} onChange={(event) => updateForm("status", event.target.value as PostForm["status"])}>
                  <option value="draft">草稿</option>
                  <option value="published">发布</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                阅读时间
                <input className="rounded-xl border border-border bg-background px-3 py-2" value={form.readingTime} onChange={(event) => updateForm("readingTime", event.target.value)} placeholder="3 min read" />
              </label>
            </div>

            <label className="grid gap-2 text-sm">
              摘要
              <textarea className="min-h-24 rounded-xl border border-border bg-background px-3 py-2 leading-6 outline-none focus:ring-2 focus:ring-ring" value={form.summary} onChange={(event) => updateForm("summary", event.target.value)} placeholder="这段会显示在首页卡片、列表和分享描述里。" />
            </label>

            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <label className="grid gap-2 text-sm">
                封面图片 URL
                <input className="rounded-xl border border-border bg-background px-3 py-2" value={form.cover} onChange={(event) => updateForm("cover", event.target.value)} placeholder="/api/uploads/xxx.jpg 或外部图片地址" />
              </label>
              <label className="rounded-xl border border-border px-4 py-2 text-center text-sm transition hover:bg-muted">
                {isUploading ? "上传中" : "上传封面"}
                <input className="hidden" type="file" accept="image/*" onChange={(event) => uploadCover(event.target.files?.[0] ?? null)} />
              </label>
            </div>

            <label className="grid gap-2 text-sm">
              标签，用英文逗号分隔
              <input className="rounded-xl border border-border bg-background px-3 py-2" value={form.tags} onChange={(event) => updateForm("tags", event.target.value)} placeholder="life, photo, code" />
            </label>

            <label className="grid gap-2 text-sm">
              正文 Markdown
              <textarea className="min-h-[420px] rounded-2xl border border-border bg-background px-4 py-3 font-mono text-sm leading-7 outline-none focus:ring-2 focus:ring-ring" value={form.content} onChange={(event) => updateForm("content", event.target.value)} placeholder={"支持 Markdown：\n\n## 小标题\n\n正文段落。\n\n![图片说明](/api/uploads/xxx.jpg)\n\n```ts\nconsole.log('hello')\n```"} />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button disabled={isSaving} className="rounded-full border border-border px-5 py-2 text-sm transition hover:bg-muted disabled:opacity-50" type="button" onClick={() => savePost("draft")}>
                保存草稿
              </button>
              <button disabled={isSaving} className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition hover:opacity-85 disabled:opacity-50" type="button" onClick={() => savePost("published")}>
                发布
              </button>
              {form.id ? (
                <button className="rounded-full border border-red-300 px-5 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950" type="button" onClick={() => deletePost(form.id!)}>
                  删除
                </button>
              ) : null}
            </div>
          </form>
        </section>
      ) : null}

      {activeTab === "comments" ? (
        <section className="grid gap-3">
          {comments.map((comment) => (
            <article key={comment.id} className="rounded-2xl border border-border p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{comment.nickname} / {comment.postType}/{comment.postSlug}</span>
                <span>{formatTime(comment.createdAt)} / {comment.status}</span>
              </div>
              <p className="text-sm leading-6">{comment.content}</p>
              <div className="mt-3 flex gap-2">
                {(["visible", "hidden", "deleted"] as const).map((nextStatus) => (
                  <button key={nextStatus} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted" onClick={() => updateCommentStatus(comment.id, nextStatus)} type="button">
                    {nextStatus}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === "room" ? (
        <section className="grid gap-3">
          {messages.map((message) => (
            <article key={message.id} className="rounded-2xl border border-border p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{message.nickname}</span>
                <span>{formatTime(message.createdAt)} / {message.status}</span>
              </div>
              <p className="text-sm leading-6">{message.content}</p>
              <div className="mt-3 flex gap-2">
                {(["visible", "hidden", "deleted"] as const).map((nextStatus) => (
                  <button key={nextStatus} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted" onClick={() => updateMessageStatus(message.id, nextStatus)} type="button">
                    {nextStatus}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
