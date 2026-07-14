"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type ModerationStatus = "visible" | "hidden" | "deleted";
type ModerationFilter = "all" | ModerationStatus;

type StudioComment = {
  id: string;
  postType: string;
  postSlug: string;
  nickname: string;
  content: string;
  status: ModerationStatus;
  createdAt: string;
};

type StudioMessage = {
  id: string;
  nickname: string;
  content: string;
  status: ModerationStatus;
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
  translations?: {
    en?: {
      title?: string;
      summary?: string;
      content?: string;
      tags?: string[];
      readingTime?: string;
      updatedAt?: string;
    };
  };
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
  journalEmptyText: string;
  notesEmptyText: string;
  gardenEmptyText: string;
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
  icpNumber: string;
  icpUrl: string;
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
  translationEnTitle: string;
  translationEnSummary: string;
  translationEnContent: string;
  translationEnTags: string;
  translationEnReadingTime: string;
  publishedAt: string;
};

const emptyPost: PostForm = {
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
  translationEnTitle: "",
  translationEnSummary: "",
  translationEnContent: "",
  translationEnTags: "",
  translationEnReadingTime: "",
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
  journalEmptyText: "",
  notesEmptyText: "",
  gardenEmptyText: "",
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
  icpNumber: "粤ICP备2026074388号-1",
  icpUrl: "https://beian.miit.gov.cn",
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
    translationEnTitle: post.translations?.en?.title ?? "",
    translationEnSummary: post.translations?.en?.summary ?? "",
    translationEnContent: post.translations?.en?.content ?? "",
    translationEnTags: post.translations?.en?.tags?.join(", ") ?? "",
    translationEnReadingTime: post.translations?.en?.readingTime ?? "",
    publishedAt: post.publishedAt,
  };
}

function settingsToForm(settings: SiteSettings): SettingsForm {
  return { ...settings, aboutParagraphs: settings.aboutParagraphs.join("\n") };
}

function postPayload(form: PostForm, status?: "draft" | "published") {
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
    translations: {
      en: {
        title: form.translationEnTitle,
        summary: form.translationEnSummary,
        content: form.translationEnContent,
        tags: form.translationEnTags.split(",").map((tag) => tag.trim()).filter(Boolean),
        readingTime: form.translationEnReadingTime,
      },
    },
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
  const [postForm, setPostForm] = useState<PostForm>(emptyPost);
  const [settingsForm, setSettingsForm] = useState<SettingsForm>(emptySettings);
  const [authState, setAuthState] = useState<"checking" | "authenticated" | "unauthenticated">("checking");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "settings" | "comments" | "room">("posts");
  const [status, setStatus] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [commentFilter, setCommentFilter] = useState<ModerationFilter>("all");
  const [messageFilter, setMessageFilter] = useState<ModerationFilter>("all");
  const [commentSearch, setCommentSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [busyModerationId, setBusyModerationId] = useState<string | null>(null);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === postForm.id) ?? null,
    [postForm.id, posts]
  );

  async function loadStudioData() {
    const [postsResponse, settingsResponse, commentsResponse, messagesResponse] = await Promise.all([
      fetch("/api/studio/posts"),
      fetch("/api/studio/settings"),
      fetch("/api/studio/comments"),
      fetch("/api/studio/messages"),
    ]);

    if ([postsResponse, settingsResponse, commentsResponse, messagesResponse].some((response) => response.status === 401)) {
      setAuthState("unauthenticated");
      setStatus("Session expired. Please login again.");
      setPosts([]);
      setComments([]);
      setMessages([]);
      return;
    }

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
    async function initializeStudio() {
      const response = await fetch("/api/studio/me", { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as { authenticated?: boolean } | null;

      if (!response.ok || !data?.authenticated) {
        setAuthState("unauthenticated");
        setStatus("");
        return;
      }

      setAuthState("authenticated");
      await loadStudioData();
    }

    initializeStudio().catch(() => {
      setAuthState("unauthenticated");
      setStatus("Session check failed. Please login again.");
    });
  }, []);

  function updatePost<K extends keyof PostForm>(key: K, value: PostForm[K]) {
    setPostForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "type" && value === "garden") next.visibility = "garden";
      return next;
    });
  }

  function updateSettings<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setSettingsForm((current) => ({ ...current, [key]: value }));
  }

  function handleUnauthorized(response: Response) {
    if (response.status !== 401) return false;
    setAuthState("unauthenticated");
    setStatus("Session expired. Please login again.");
    return true;
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password.trim()) {
      setStatus("Password is required.");
      return;
    }

    setIsLoggingIn(true);
    setStatus("");

    try {
      const response = await fetch("/api/studio/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setStatus(
          data?.error === "INVALID_PASSWORD"
            ? "Invalid password."
            : data?.error === "RATE_LIMITED"
              ? "Too many attempts. Try again later."
              : data?.error === "STUDIO_NOT_CONFIGURED"
                ? "Studio password is not configured on the server."
                : "Login failed."
        );
        return;
      }

      setPassword("");
      setAuthState("authenticated");
      await loadStudioData();
      setStatus("");
    } finally {
      setIsLoggingIn(false);
    }
  }

  function newPost(type: PostForm["type"] = "journal") {
    setPostForm({
      ...emptyPost,
      type,
      visibility: type === "garden" ? "garden" : "public",
      publishedAt: new Date().toISOString(),
    });
    setActiveTab("posts");
    setStatus("New draft started.");
  }

  async function savePost(nextStatus?: "draft" | "published") {
    if (!postForm.title.trim()) {
      setStatus("Title is required.");
      return;
    }

    setIsSaving(true);
    setStatus("");

    try {
      const endpoint = postForm.id
        ? `/api/studio/posts/${encodeURIComponent(postForm.id)}`
        : "/api/studio/posts";
      const response = await fetch(endpoint, {
        method: postForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postPayload(postForm, nextStatus)),
      });

      if (handleUnauthorized(response)) return;

      if (!response.ok) {
        setStatus("Save failed.");
        return;
      }

      const data = (await response.json()) as { post?: StudioPost };
      if (data.post) {
        setPostForm(postToForm(data.post));
        await loadStudioData();
        setStatus(data.post.status === "published" ? "Published." : "Draft saved.");
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

      if (handleUnauthorized(response)) return;

      if (!response.ok) {
        setStatus("Settings save failed.");
        return;
      }

      const data = (await response.json()) as { settings?: SiteSettings };
      if (data.settings) setSettingsForm(settingsToForm(data.settings));
      setStatus("Settings saved. Refresh the public page to see updates.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post permanently?")) return;

    const response = await fetch(`/api/studio/posts/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (handleUnauthorized(response)) return;
    if (!response.ok) {
      setStatus("Delete failed.");
      return;
    }

    setPostForm(emptyPost);
    await loadStudioData();
    setStatus("Post deleted.");
  }

  async function uploadCover(file: File | null) {
    if (!file) return;

    const body = new FormData();
    body.append("file", file);
    setIsUploading(true);

    try {
      const response = await fetch("/api/studio/uploads", { method: "POST", body });
      const data = (await response.json()) as { url?: string; error?: string };

      if (handleUnauthorized(response)) return;

      if (!response.ok || !data.url) {
        setStatus(data.error === "FILE_TOO_LARGE" ? "Image must be under 5MB." : "Upload failed.");
        return;
      }

      updatePost("cover", data.url);
      setStatus("Cover uploaded.");
    } finally {
      setIsUploading(false);
    }
  }

  async function generateEnglishTranslation() {
    if (!postForm.title.trim() || !postForm.content.trim()) {
      setStatus("Title and Markdown content are required before translation.");
      return;
    }

    setIsTranslating(true);
    setStatus("Generating English translation...");

    try {
      const response = await fetch("/api/studio/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage: "en",
          title: postForm.title,
          summary: postForm.summary,
          content: postForm.content,
          tags: postForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          readingTime: postForm.readingTime,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        translation?: {
          title?: string;
          summary?: string;
          content?: string;
          tags?: string[];
          readingTime?: string;
        };
        error?: string;
      } | null;

      if (handleUnauthorized(response)) return;

      if (!response.ok || !data?.translation) {
        setStatus(data?.error === "TRANSLATION_NOT_CONFIGURED" ? "Translation API is not configured on the server." : `Translation failed: ${data?.error ?? "unknown error"}`);
        return;
      }

      setPostForm((current) => ({
        ...current,
        translationEnTitle: data.translation?.title ?? "",
        translationEnSummary: data.translation?.summary ?? "",
        translationEnContent: data.translation?.content ?? "",
        translationEnTags: data.translation?.tags?.join(", ") ?? "",
        translationEnReadingTime: data.translation?.readingTime ?? "",
      }));
      setStatus("English translation generated. Review it, then save draft or publish.");
    } finally {
      setIsTranslating(false);
    }
  }

  async function updateModeration(
    kind: "comments" | "messages",
    id: string,
    nextStatus: ModerationStatus
  ) {
    setBusyModerationId(id);
    try {
      const response = await fetch(`/api/studio/${kind}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (handleUnauthorized(response)) return;

      if (!response.ok) {
        setStatus("Moderation update failed. Please login again or retry.");
        return;
      }

      await loadStudioData();
      setStatus(`${kind} item set to ${nextStatus}.`);
    } finally {
      setBusyModerationId(null);
    }
  }

  async function purgeModeration(kind: "comments" | "messages", id: string) {
    if (!confirm("Permanently delete this item? This cannot be undone.")) return;

    setBusyModerationId(id);
    try {
      const response = await fetch(`/api/studio/${kind}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (handleUnauthorized(response)) return;

      if (!response.ok) {
        setStatus("Permanent delete failed. Please login again or retry.");
        return;
      }

      await loadStudioData();
      setStatus("Item permanently deleted.");
    } finally {
      setBusyModerationId(null);
    }
  }

  async function logout() {
    await fetch("/api/studio/logout", { method: "POST" });
    setPosts([]);
    setComments([]);
    setMessages([]);
    setPostForm(emptyPost);
    setAuthState("unauthenticated");
    setStatus("");
  }

  const inputClass = "w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring";

  if (authState === "checking") {
    return (
      <div className="mx-auto grid min-h-[60vh] w-full max-w-xl place-items-center py-6 sm:py-8">
        <div className="w-full rounded-3xl border border-border p-6 text-center">
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Studio</p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">Checking session</h1>
          <p className="mt-3 text-sm text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return (
      <div className="mx-auto grid min-h-[60vh] w-full max-w-xl place-items-center py-6 sm:py-8">
        <form className="grid w-full gap-5 rounded-2xl border border-border p-5 sm:rounded-3xl sm:p-6" onSubmit={login}>
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Studio</p>
            <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">Login required</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Your studio session is missing or expired. Login again to manage posts, translations, settings, comments, and room messages.
            </p>
          </div>
          {status ? <div className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">{status}</div> : null}
          <label className="grid gap-2 text-sm">
            Password
            <input
              className={inputClass}
              type="password"
              value={password}
              autoFocus
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button disabled={isLoggingIn} className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition hover:opacity-85 disabled:opacity-50" type="submit">
            {isLoggingIn ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl py-4 sm:py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Studio</p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl md:text-6xl">Content Studio</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage posts, site copy, comments, and room messages.
          </p>
        </div>
        <button className="rounded-full border border-border px-4 py-2 text-sm transition hover:bg-muted" onClick={logout} type="button">
          Logout
        </button>
      </header>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mb-6 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {[
          ["posts", `Posts ${posts.length}`],
          ["settings", "Site settings"],
          ["comments", `Comments ${comments.length}`],
          ["room", `Room ${messages.length}`],
        ].map(([key, label]) => (
          <button key={key} className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${activeTab === key ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`} onClick={() => setActiveTab(key as typeof activeTab)} type="button">
            {label}
          </button>
        ))}
      </div>

      {status ? <div className="mb-6 rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">{status}</div> : null}

      {activeTab === "settings" ? (
        <SettingsPanel form={settingsForm} inputClass={inputClass} isSaving={isSaving} onChange={updateSettings} onSave={saveSettings} />
      ) : null}

      {activeTab === "posts" ? (
        <section className="grid gap-4 lg:grid-cols-[360px_1fr] lg:gap-6">
          <aside className="min-w-0 rounded-2xl border border-border p-3 sm:rounded-3xl sm:p-4">
            <div className="mb-4 grid grid-cols-3 gap-2">
              <button className="rounded-full bg-foreground px-3 py-2 text-xs text-background" onClick={() => newPost("journal")} type="button">New journal</button>
              <button className="rounded-full bg-foreground px-3 py-2 text-xs text-background" onClick={() => newPost("note")} type="button">New note</button>
              <button className="rounded-full bg-foreground px-3 py-2 text-xs text-background" onClick={() => newPost("garden")} type="button">New garden</button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:max-h-[72vh] lg:overflow-x-visible lg:overflow-y-auto lg:pb-0 lg:pr-1">
              {posts.map((post) => (
                <button key={post.id} className={`min-w-[220px] rounded-2xl border p-4 text-left transition hover:bg-muted lg:min-w-0 ${selectedPost?.id === post.id ? "border-foreground" : "border-border"}`} onClick={() => setPostForm(postToForm(post))} type="button">
                  <div className="mb-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground"><span>{post.type}</span><span>{post.status}</span></div>
                  <strong className="line-clamp-2 text-sm font-medium">{post.title}</strong>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{post.summary || "No summary"}</p>
                </button>
              ))}
            </div>
          </aside>

          <form className="grid min-w-0 gap-5 overflow-hidden rounded-2xl border border-border p-4 sm:rounded-3xl sm:p-5" onSubmit={(event) => { event.preventDefault(); savePost(); }}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">Title<input className={inputClass} value={postForm.title} onChange={(event) => updatePost("title", event.target.value)} /></label>
              <label className="grid gap-2 text-sm">URL slug<input className={inputClass} value={postForm.slug} onChange={(event) => updatePost("slug", event.target.value)} /></label>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <label className="grid gap-2 text-sm">Type<select className={inputClass} value={postForm.type} onChange={(event) => updatePost("type", event.target.value as PostForm["type"])}><option value="journal">Journal</option><option value="note">Notes</option><option value="garden">Garden</option></select></label>
              <label className="grid gap-2 text-sm">Visibility<select className={inputClass} value={postForm.visibility} disabled={postForm.type === "garden"} onChange={(event) => updatePost("visibility", event.target.value as PostForm["visibility"])}><option value="public">Public</option><option value="garden">Garden</option></select></label>
              <label className="grid gap-2 text-sm">Status<select className={inputClass} value={postForm.status} onChange={(event) => updatePost("status", event.target.value as PostForm["status"])}><option value="draft">Draft</option><option value="published">Published</option></select></label>
              <label className="grid gap-2 text-sm">Reading time<input className={inputClass} value={postForm.readingTime} onChange={(event) => updatePost("readingTime", event.target.value)} /></label>
            </div>
            <label className="grid gap-2 text-sm">Summary<textarea className="min-h-24 rounded-xl border border-border bg-background px-3 py-2 leading-6 outline-none focus:ring-2 focus:ring-ring" value={postForm.summary} onChange={(event) => updatePost("summary", event.target.value)} /></label>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <label className="grid gap-2 text-sm">Cover URL<input className={inputClass} value={postForm.cover} onChange={(event) => updatePost("cover", event.target.value)} /></label>
              <label className="rounded-xl border border-border px-4 py-2 text-center text-sm transition hover:bg-muted">{isUploading ? "Uploading" : "Upload cover"}<input className="hidden" type="file" accept="image/*" onChange={(event) => uploadCover(event.target.files?.[0] ?? null)} /></label>
            </div>
            <label className="grid gap-2 text-sm">Tags, comma separated<input className={inputClass} value={postForm.tags} onChange={(event) => updatePost("tags", event.target.value)} /></label>
            <label className="grid min-w-0 gap-2 text-sm">Markdown<textarea className="min-h-[320px] w-full min-w-0 rounded-2xl border border-border bg-background px-4 py-3 font-mono text-sm leading-7 outline-none focus:ring-2 focus:ring-ring sm:min-h-[420px]" value={postForm.content} onChange={(event) => updatePost("content", event.target.value)} /></label>
            <section className="grid gap-4 rounded-3xl border border-border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-medium">English translation</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Server-side API only. Visitors read the saved translation with ?lang=en.
                  </p>
                </div>
                <button disabled={isTranslating} className="rounded-full border border-border px-4 py-2 text-xs transition hover:bg-muted disabled:opacity-50" type="button" onClick={generateEnglishTranslation}>
                  {isTranslating ? "Translating..." : "Generate EN"}
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">EN title<input className={inputClass} value={postForm.translationEnTitle} onChange={(event) => updatePost("translationEnTitle", event.target.value)} /></label>
                <label className="grid gap-2 text-sm">EN reading time<input className={inputClass} value={postForm.translationEnReadingTime} onChange={(event) => updatePost("translationEnReadingTime", event.target.value)} /></label>
              </div>
              <label className="grid gap-2 text-sm">EN summary<textarea className="min-h-20 rounded-xl border border-border bg-background px-3 py-2 leading-6 outline-none focus:ring-2 focus:ring-ring" value={postForm.translationEnSummary} onChange={(event) => updatePost("translationEnSummary", event.target.value)} /></label>
              <label className="grid gap-2 text-sm">EN tags, comma separated<input className={inputClass} value={postForm.translationEnTags} onChange={(event) => updatePost("translationEnTags", event.target.value)} /></label>
              <label className="grid min-w-0 gap-2 text-sm">EN Markdown<textarea className="min-h-[240px] w-full min-w-0 rounded-2xl border border-border bg-background px-4 py-3 font-mono text-sm leading-7 outline-none focus:ring-2 focus:ring-ring sm:min-h-[300px]" value={postForm.translationEnContent} onChange={(event) => updatePost("translationEnContent", event.target.value)} /></label>
            </section>
            <div className="flex flex-wrap items-center gap-3">
              <button disabled={isSaving} className="rounded-full border border-border px-5 py-2 text-sm transition hover:bg-muted disabled:opacity-50" type="button" onClick={() => savePost("draft")}>Save draft</button>
              <button disabled={isSaving} className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition hover:opacity-85 disabled:opacity-50" type="button" onClick={() => savePost("published")}>Publish</button>
              {postForm.id ? <button className="rounded-full border border-red-300 px-5 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950" type="button" onClick={() => deletePost(postForm.id!)}>Delete</button> : null}
            </div>
          </form>
        </section>
      ) : null}

      {activeTab === "comments" ? (
        <ModerationList
          title="Comment moderation"
          items={comments}
          filter={commentFilter}
          search={commentSearch}
          busyId={busyModerationId}
          onFilter={setCommentFilter}
          onSearch={setCommentSearch}
          onStatus={(id, nextStatus) => updateModeration("comments", id, nextStatus)}
          onPurge={(id) => purgeModeration("comments", id)}
        />
      ) : null}

      {activeTab === "room" ? (
        <ModerationList
          title="Room moderation"
          items={messages}
          filter={messageFilter}
          search={messageSearch}
          busyId={busyModerationId}
          onFilter={setMessageFilter}
          onSearch={setMessageSearch}
          onStatus={(id, nextStatus) => updateModeration("messages", id, nextStatus)}
          onPurge={(id) => purgeModeration("messages", id)}
        />
      ) : null}
    </div>
  );
}

function SettingsPanel({
  form,
  inputClass,
  isSaving,
  onChange,
  onSave,
}: {
  form: SettingsForm;
  inputClass: string;
  isSaving: boolean;
  onChange: <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => void;
  onSave: () => void;
}) {
  return (
    <section className="grid min-w-0 gap-5 overflow-hidden rounded-2xl border border-border p-4 sm:rounded-3xl sm:p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm">Site name<input className={inputClass} value={form.siteName} onChange={(event) => onChange("siteName", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Site URL<input className={inputClass} value={form.siteUrl} onChange={(event) => onChange("siteUrl", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Email<input className={inputClass} value={form.email} onChange={(event) => onChange("email", event.target.value)} /></label>
      </div>
      <label className="grid gap-2 text-sm">SEO description<textarea className="min-h-20 rounded-xl border border-border bg-background px-3 py-2 leading-6" value={form.siteDescription} onChange={(event) => onChange("siteDescription", event.target.value)} /></label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">GitHub<input className={inputClass} value={form.githubUrl} onChange={(event) => onChange("githubUrl", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Social URL<input className={inputClass} value={form.socialUrl} onChange={(event) => onChange("socialUrl", event.target.value)} /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">ICP number<input className={inputClass} value={form.icpNumber} onChange={(event) => onChange("icpNumber", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">ICP URL<input className={inputClass} value={form.icpUrl} onChange={(event) => onChange("icpUrl", event.target.value)} /></label>
      </div>
      <div className="grid gap-4 border-t border-border pt-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm">Home eyebrow<input className={inputClass} value={form.homeEyebrow} onChange={(event) => onChange("homeEyebrow", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Home title<input className={inputClass} value={form.homeTitle} onChange={(event) => onChange("homeTitle", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Journal title<input className={inputClass} value={form.journalTitle} onChange={(event) => onChange("journalTitle", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Notes title<input className={inputClass} value={form.notesTitle} onChange={(event) => onChange("notesTitle", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Garden title<input className={inputClass} value={form.gardenTitle} onChange={(event) => onChange("gardenTitle", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Journal description<input className={inputClass} value={form.journalDescription} onChange={(event) => onChange("journalDescription", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Notes description<input className={inputClass} value={form.notesDescription} onChange={(event) => onChange("notesDescription", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Garden description<input className={inputClass} value={form.gardenDescription} onChange={(event) => onChange("gardenDescription", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Room title<input className={inputClass} value={form.roomTitle} onChange={(event) => onChange("roomTitle", event.target.value)} /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">About title<textarea className="min-h-28 rounded-xl border border-border bg-background px-3 py-2 leading-6" value={form.aboutTitle} onChange={(event) => onChange("aboutTitle", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">About paragraphs<textarea className="min-h-28 rounded-xl border border-border bg-background px-3 py-2 leading-6" value={form.aboutParagraphs} onChange={(event) => onChange("aboutParagraphs", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Footer title<textarea className="min-h-28 rounded-xl border border-border bg-background px-3 py-2 leading-6" value={form.footerTitle} onChange={(event) => onChange("footerTitle", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Room description<textarea className="min-h-28 rounded-xl border border-border bg-background px-3 py-2 leading-6" value={form.roomDescription} onChange={(event) => onChange("roomDescription", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Journal empty text<textarea className="min-h-20 rounded-xl border border-border bg-background px-3 py-2 leading-6" value={form.journalEmptyText} onChange={(event) => onChange("journalEmptyText", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Notes empty text<textarea className="min-h-20 rounded-xl border border-border bg-background px-3 py-2 leading-6" value={form.notesEmptyText} onChange={(event) => onChange("notesEmptyText", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Garden empty text<textarea className="min-h-20 rounded-xl border border-border bg-background px-3 py-2 leading-6" value={form.gardenEmptyText} onChange={(event) => onChange("gardenEmptyText", event.target.value)} /></label>
      </div>
      <div className="flex flex-wrap gap-5 rounded-2xl bg-muted/50 p-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.showStaticMdxContent} onChange={(event) => onChange("showStaticMdxContent", event.target.checked)} />Show legacy MDX content</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.showGardenDot} onChange={(event) => onChange("showGardenDot", event.target.checked)} />Show garden dot</label>
      </div>
      <button disabled={isSaving} className="w-fit rounded-full bg-foreground px-5 py-2 text-sm text-background transition hover:opacity-85 disabled:opacity-50" type="button" onClick={onSave}>Save settings</button>
    </section>
  );
}

function ModerationList<T extends { id: string; nickname: string; content: string; status: ModerationStatus; createdAt: string; postType?: string; postSlug?: string }>({
  title,
  items,
  filter,
  search,
  busyId,
  onFilter,
  onSearch,
  onStatus,
  onPurge,
}: {
  title: string;
  items: T[];
  filter: ModerationFilter;
  search: string;
  busyId: string | null;
  onFilter: (filter: ModerationFilter) => void;
  onSearch: (value: string) => void;
  onStatus: (id: string, status: T["status"]) => void;
  onPurge: (id: string) => void;
}) {
  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    const matchesStatus = filter === "all" || item.status === filter;
    const searchable = [item.nickname, item.content, item.postType, item.postSlug, item.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesStatus && (!normalizedSearch || searchable.includes(normalizedSearch));
  });

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-medium tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Showing {filteredItems.length} / {items.length}</p>
          </div>
          <input className="w-full min-w-0 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-auto sm:min-w-[240px]" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search nickname, content, slug" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["all", "visible", "hidden", "deleted"] as const).map((nextFilter) => (
            <button key={nextFilter} className={`rounded-full border px-4 py-2 text-xs transition ${filter === nextFilter ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`} onClick={() => onFilter(nextFilter)} type="button">
              {nextFilter}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.map((item) => (
        <article key={item.id} className="rounded-2xl border border-border p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{item.nickname}{item.postType ? ` / ${item.postType}/${item.postSlug}` : ""}</span>
            <span className="rounded-full border border-border px-2 py-1">{formatTime(item.createdAt)} / {item.status}</span>
          </div>
          <p className="text-sm leading-6">{item.content}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["visible", "hidden", "deleted"] as const).map((nextStatus) => (
              <button key={nextStatus} className={`rounded-full border px-3 py-1 text-xs transition disabled:opacity-50 ${item.status === nextStatus ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`} disabled={busyId === item.id} onClick={() => onStatus(item.id, nextStatus as T["status"])} type="button">
                {nextStatus === "visible" ? "Set visible" : nextStatus === "hidden" ? "Hide" : "Soft delete"}
              </button>
            ))}
            <button className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950" disabled={busyId === item.id} onClick={() => onPurge(item.id)} type="button">
              Purge
            </button>
            {busyId === item.id ? <span className="px-2 py-1 text-xs text-muted-foreground">Working...</span> : null}
          </div>
        </article>
      ))}

      {filteredItems.length === 0 ? <div className="rounded-3xl border border-dashed border-border p-8 text-sm text-muted-foreground">No matching items.</div> : null}
    </section>
  );
}
