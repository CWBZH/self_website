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

type SiteSettings = {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  locale: string;
  showStaticMdxContent: boolean;
  homeEyebrow: string;
  homeTitle: string;
  journalEyebrow: string;
  journalTitle: string;
  journalDescription: string;
  notesEyebrow: string;
  notesTitle: string;
  notesDescription: string;
  gardenEyebrow: string;
  gardenTitle: string;
  gardenDescription: string;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutParagraphs: string[];
  roomEyebrow: string;
  roomTitle: string;
  roomDescription: string;
  footerEyebrow: string;
  footerTitle: string;
  email: string;
  githubUrl: string;
  socialUrl: string;
  showGardenDot: boolean;
};

type SettingsForm = Omit<SiteSettings, "aboutParagraphs"> & {
  aboutParagraphs: string;
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

const emptySettings: SettingsForm = {
  siteName: "",
  siteDescription: "",
  siteUrl: "",
  locale: "zh_CN",
  showStaticMdxContent: false,
  homeEyebrow: "",
  homeTitle: "",
  journalEyebrow: "",
  journalTitle: "",
  journalDescription: "",
  notesEyebrow: "",
  notesTitle: "",
  notesDescription: "",
  gardenEyebrow: "",
  gardenTitle: "",
  gardenDescription: "",
  aboutEyebrow: "",
  aboutTitle: "",
  aboutParagraphs: "",
  roomEyebrow: "",
  roomTitle: "",
  roomDescription: "",
  footerEyebrow: "",
  footerTitle: "",
  email: "",
  githubUrl: "",
  socialUrl: "",
  showGardenDot: true,
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

function settingsToForm(settings: SiteSettings): SettingsForm {
  return {
    ...settings,
    aboutParagraphs: settings.aboutParagraphs.join("\n"),
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
    tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    readingTime: form.readingTime,
    publishedAt: form.publishedAt,
  };
}

function settingsPayload(form: SettingsForm) {
  return {
    ...form,
    aboutParagraphs: form.aboutParagraphs
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

export function StudioDashboard() {
  const [posts, setPosts] = useState<StudioPost[]>([]);
  const [comments, setComments] = useState<StudioComment[]>([]);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [settingsForm, setSettingsForm] = useState<SettingsForm>(emptySettings);
  const [activeTab, setActiveTab] = useState<"posts" | "settings" | "comments" | "room">("posts");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === form.id) ?? null,
    [form.id, posts]
  );

  async function loadStudioData() {
    const [postsResponse, settingsResponse, commentsResponse, messagesResponse] = await Promise.all([
      fetch("/api/studio/posts"),
      fetch("/api/studio/settings"),
      fetch("/api/studio/comments"),
      fetch("/api/studio/messages"),
    ]);

    if (postsResponse.ok) {
      const data = (await postsResponse.json()) as { posts?: StudioPost[] };
      setPosts(data.posts ?? []);
    }

    if (settingsResponse.ok) {
      const data = (await settingsResponse.json()) as { settings?: SiteSettings };
      if (data.settings) setSettingsForm(settingsToForm(data.settings));
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
      if (key === "type" && value === "garden") next.visibility = "garden";
      return next;
    });
  }

  function updateSettings<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setSettingsForm((current) => ({ ...current, [key]: value }));
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
      setStatus("标题不能为空。每篇内容至少需要一个标题。");
      return;
    }

    setIsSaving(true);
    setStatus("");

    try {
      const endpoint = form.id ? `/api/studio/posts/${encodeURIComponent(form.id)}` : "/api/studio/posts";
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
        setStatus(data.post.status === "published" ? "已发布，前台会立即显示。" : "草稿已保存。");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function saveSettings() {
    setIsSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/studio/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsPayload(settingsForm)),
      });

      if (!response.ok) {
        setStatus("站点设置保存失败。");
        return;
      }

      const data = (await response.json()) as { settings?: SiteSettings };
      if (data.settings) setSettingsForm(settingsToForm(data.settings));
      setStatus("站点设置已保存，前台刷新后生效。");
    } finally {
      setIsSaving(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm("确定删除这篇内容吗？删除后不可从后台恢复。")) return;

    const response = await fetch(`/api/studio/posts/${encodeURIComponent(id)}`, { method: "DELETE" });

    if (!response.ok) {
      setStatus("删除失败。");
      return;
    }

    setForm(emptyForm);
    await loadStudioData();
    setStatus("内容已删除。");
  }

  async function uploadCover(file: File | null) {
    if (!file) return;

    const body = new FormData();
    body.append("file", file);
    setIsUploading(true);

    try {
      const response = await fetch("/api/studio/uploads", { method: "POST", body });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setStatus(data.error === "FILE_TOO_LARGE" ? "图片不能超过 5MB。" : "图片上传失败。");
        return;
      }

      updateForm("cover", data.url);
      setStatus("封面已上传。");
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

  const textInputClass = "rounded-xl border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Studio</p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight md:text-6xl">内容运营后台</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            内容、站点文案、评论和聊天室消息都在这里管理。
          </p>
        </div>
        <button className="rounded-full border border-border px-4 py-2 text-sm transition hover:bg-muted" onClick={logout} type="button">
          退出登录
        </button>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          ["posts", `内容 ${posts.length}`],
          ["settings", "站点设置"],
          ["comments", `评论 ${comments.length}`],
          ["room", `聊天室 ${messages.length}`],
        ].map(([key, label]) => (
          <button key={key} className={`rounded-full border px-4 py-2 text-sm transition ${activeTab === key ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`} onClick={() => setActiveTab(key as typeof activeTab)} type="button">
            {label}
          </button>
        ))}
      </div>

      {status ? <div className="mb-6 rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">{status}</div> : null}

      {activeTab === "settings" ? (
        <section className="grid gap-5 rounded-3xl border border-border p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm">网站名称<input className={textInputClass} value={settingsForm.siteName} onChange={(event) => updateSettings("siteName", event.target.value)} /></label>
            <label className="grid gap-2 text-sm">网站 URL<input className={textInputClass} value={settingsForm.siteUrl} onChange={(event) => updateSettings("siteUrl", event.target.value)} /></label>
            <label className="grid gap-2 text-sm">邮箱<input className={textInputClass} value={settingsForm.email} onChange={(event) => updateSettings("email", event.target.value)} /></label>
          </div>
          <label className="grid gap-2 text-sm">SEO 描述<textarea className="min-h-20 rounded-xl border border-border bg-background px-3 py-2 leading-6" value={settingsForm.siteDescription} onChange={(event) => updateSettings("siteDescription", event.target.value)} /></label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">GitHub<input className={textInputClass} value={settingsForm.githubUrl} onChange={(event) => updateSettings("githubUrl", event.target.value)} /></label>
            <label className="grid gap-2 text-sm">其他社交链接<input className={textInputClass} value={settingsForm.socialUrl} onChange={(event) => updateSettings("socialUrl", event.target.value)} /></label>
          </div>

          <div className="grid gap-4 border-t border-border pt-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm">首页小标题<input className={textInputClass} value={settingsForm.homeEyebrow} onChange={(event) => updateSettings("homeEyebrow", event.target.value)} /></label>
            <label className="grid gap-2 text-sm">首页主标题<input className={textInputClass} value={settingsForm.homeTitle} onChange={(event) => updateSettings("homeTitle", event.target.value)} /></label>
            <label className="grid gap-2 text-sm">Journal 标题<input className={textInputClass} value={settingsForm.journalTitle} onChange={(event) => updateSettings("journalTitle", event.target.value)} /></label>
            <label className="grid gap-2 text-sm">Notes 标题<input className={textInputClass} value={settingsForm.notesTitle} onChange={(event) => updateSettings("notesTitle", event.target.value)} /></label>
            <label className="grid gap-2 text-sm">Garden 标题<input className={textInputClass} value={settingsForm.gardenTitle} onChange={(event) => updateSettings("gardenTitle", event.target.value)} /></label>
            <label className="grid gap-2 text-sm">Room 标题<input className={textInputClass} value={settingsForm.roomTitle} onChange={(event) => updateSettings("roomTitle", event.target.value)} /></label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">About 大标题<textarea className="min-h-28 rounded-xl border border-border bg-background px-3 py-2 leading-6" value={settingsForm.aboutTitle} onChange={(event) => updateSettings("aboutTitle", event.target.value)} /></label>
            <label className="grid gap-2 text-sm">About 段落，一行一段<textarea className="min-h-28 rounded-xl border border-border bg-background px-3 py-2 leading-6" value={settingsForm.aboutParagraphs} onChange={(event) => updateSettings("aboutParagraphs", event.target.value)} /></label>
            <label className="grid gap-2 text-sm">Footer 标语<textarea className="min-h-28 rounded-xl border border-border bg-background px-3 py-2 leading-6" value={settingsForm.footerTitle} onChange={(event) => updateSettings("footerTitle", event.target.value)} /></label>
            <label className="grid gap-2 text-sm">Room 说明<textarea className="min-h-28 rounded-xl border border-border bg-background px-3 py-2 leading-6" value={settingsForm.roomDescription} onChange={(event) => updateSettings("roomDescription", event.target.value)} /></label>
          </div>

          <div className="flex flex-wrap gap-5 rounded-2xl bg-muted/50 p-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={settingsForm.showStaticMdxContent} onChange={(event) => updateSettings("showStaticMdxContent", event.target.checked)} />显示旧 MDX 模板内容</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settingsForm.showGardenDot} onChange={(event) => updateSettings("showGardenDot", event.target.checked)} />显示页脚小句号入口</label>
          </div>

          <button disabled={isSaving} className="w-fit rounded-full bg-foreground px-5 py-2 text-sm text-background transition hover:opacity-85 disabled:opacity-50" type="button" onClick={saveSettings}>
            保存站点设置
          </button>
        </section>
      ) : null}

      {activeTab === "posts" ? (
        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-3xl border border-border p-4">
            <div className="mb-4 grid grid-cols-3 gap-2">
              <button className="rounded-full bg-foreground px-3 py-2 text-xs text-background" onClick={() => newPost("journal")} type="button">新文章</button>
              <button className="rounded-full bg-foreground px-3 py-2 text-xs text-background" onClick={() => newPost("note")} type="button">新随笔</button>
              <button className="rounded-full bg-foreground px-3 py-2 text-xs text-background" onClick={() => newPost("garden")} type="button">新花园</button>
            </div>
            <div className="grid max-h-[72vh] gap-2 overflow-y-auto pr-1">
              {posts.map((post) => (
                <button key={post.id} className={`rounded-2xl border p-4 text-left transition hover:bg-muted ${selectedPost?.id === post.id ? "border-foreground" : "border-border"}`} onClick={() => setForm(postToForm(post))} type="button">
                  <div className="mb-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground"><span>{post.type}</span><span>{post.status === "published" ? "已发布" : "草稿"}</span></div>
                  <strong className="line-clamp-2 text-sm font-medium">{post.title}</strong>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{post.summary || "还没有摘要"}</p>
                </button>
              ))}
            </div>
          </aside>

          <form className="grid gap-5 rounded-3xl border border-border p-5" onSubmit={(event) => { event.preventDefault(); savePost(); }}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">标题<input className={textInputClass} value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="例如：一间数字客厅" /></label>
              <label className="grid gap-2 text-sm">URL Slug<input className={textInputClass} value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} placeholder="digital-room" /></label>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <label className="grid gap-2 text-sm">栏目<select className="rounded-xl border border-border bg-background px-3 py-2" value={form.type} onChange={(event) => updateForm("type", event.target.value as PostForm["type"])}><option value="journal">Journal 长文章</option><option value="note">Notes 短随笔</option><option value="garden">Garden 半隐藏</option></select></label>
              <label className="grid gap-2 text-sm">可见性<select className="rounded-xl border border-border bg-background px-3 py-2" value={form.visibility} disabled={form.type === "garden"} onChange={(event) => updateForm("visibility", event.target.value as PostForm["visibility"])}><option value="public">公开</option><option value="garden">半隐藏花园</option></select></label>
              <label className="grid gap-2 text-sm">状态<select className="rounded-xl border border-border bg-background px-3 py-2" value={form.status} onChange={(event) => updateForm("status", event.target.value as PostForm["status"])}><option value="draft">草稿</option><option value="published">发布</option></select></label>
              <label className="grid gap-2 text-sm">阅读时间<input className="rounded-xl border border-border bg-background px-3 py-2" value={form.readingTime} onChange={(event) => updateForm("readingTime", event.target.value)} placeholder="3 min read" /></label>
            </div>
            <label className="grid gap-2 text-sm">摘要<textarea className="min-h-24 rounded-xl border border-border bg-background px-3 py-2 leading-6 outline-none focus:ring-2 focus:ring-ring" value={form.summary} onChange={(event) => updateForm("summary", event.target.value)} /></label>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <label className="grid gap-2 text-sm">封面图片 URL<input className="rounded-xl border border-border bg-background px-3 py-2" value={form.cover} onChange={(event) => updateForm("cover", event.target.value)} /></label>
              <label className="rounded-xl border border-border px-4 py-2 text-center text-sm transition hover:bg-muted">{isUploading ? "上传中" : "上传封面"}<input className="hidden" type="file" accept="image/*" onChange={(event) => uploadCover(event.target.files?.[0] ?? null)} /></label>
            </div>
            <label className="grid gap-2 text-sm">标签，用英文逗号分隔<input className="rounded-xl border border-border bg-background px-3 py-2" value={form.tags} onChange={(event) => updateForm("tags", event.target.value)} /></label>
            <label className="grid gap-2 text-sm">正文 Markdown<textarea className="min-h-[420px] rounded-2xl border border-border bg-background px-4 py-3 font-mono text-sm leading-7 outline-none focus:ring-2 focus:ring-ring" value={form.content} onChange={(event) => updateForm("content", event.target.value)} /></label>
            <div className="flex flex-wrap items-center gap-3">
              <button disabled={isSaving} className="rounded-full border border-border px-5 py-2 text-sm transition hover:bg-muted disabled:opacity-50" type="button" onClick={() => savePost("draft")}>保存草稿</button>
              <button disabled={isSaving} className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition hover:opacity-85 disabled:opacity-50" type="button" onClick={() => savePost("published")}>发布</button>
              {form.id ? <button className="rounded-full border border-red-300 px-5 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950" type="button" onClick={() => deletePost(form.id!)}>删除</button> : null}
            </div>
          </form>
        </section>
      ) : null}

      {activeTab === "comments" ? <ModerationList items={comments} onStatus={updateCommentStatus} /> : null}
      {activeTab === "room" ? <ModerationList items={messages} onStatus={updateMessageStatus} /> : null}
    </div>
  );
}

function ModerationList<T extends { id: string; nickname: string; content: string; status: "visible" | "hidden" | "deleted"; createdAt: string; postType?: string; postSlug?: string }>({
  items,
  onStatus,
}: {
  items: T[];
  onStatus: (id: string, status: T["status"]) => void;
}) {
  return (
    <section className="grid gap-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-border p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{item.nickname}{item.postType ? ` / ${item.postType}/${item.postSlug}` : ""}</span>
            <span>{formatTime(item.createdAt)} / {item.status}</span>
          </div>
          <p className="text-sm leading-6">{item.content}</p>
          <div className="mt-3 flex gap-2">
            {(["visible", "hidden", "deleted"] as const).map((nextStatus) => (
              <button key={nextStatus} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted" onClick={() => onStatus(item.id, nextStatus as T["status"])} type="button">
                {nextStatus}
              </button>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
