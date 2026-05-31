"use client";

import { useEffect, useMemo, useState } from "react";

type StudioComment = {
  id: string;
  postType: string;
  postSlug: string;
  parentId: string | null;
  nickname: string;
  content: string;
  likeCount: number;
  status: "visible" | "hidden" | "deleted";
  createdAt: string;
};

type StudioMessage = {
  id: string;
  roomId: string;
  nickname: string;
  content: string;
  status: "visible" | "hidden" | "deleted";
  createdAt: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function countByStatus<T extends { status: string }>(items: T[]) {
  return {
    visible: items.filter((item) => item.status === "visible").length,
    hidden: items.filter((item) => item.status === "hidden").length,
    deleted: items.filter((item) => item.status === "deleted").length,
  };
}

export function StudioDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [comments, setComments] = useState<StudioComment[]>([]);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const commentStats = useMemo(() => countByStatus(comments), [comments]);
  const messageStats = useMemo(() => countByStatus(messages), [messages]);

  async function loadStudioData() {
    setLoading(true);
    try {
      const [commentsResponse, messagesResponse] = await Promise.all([
        fetch("/api/studio/comments"),
        fetch("/api/studio/messages"),
      ]);

      if (!commentsResponse.ok || !messagesResponse.ok) {
        setAuthenticated(false);
        return;
      }

      const commentsData = (await commentsResponse.json()) as {
        comments?: StudioComment[];
      };
      const messagesData = (await messagesResponse.json()) as {
        messages?: StudioMessage[];
      };

      setComments(commentsData.comments ?? []);
      setMessages(messagesData.messages ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch("/api/studio/me")
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => {
        setAuthenticated(Boolean(data.authenticated));
        if (data.authenticated) {
          loadStudioData().catch(() => undefined);
        }
      })
      .catch(() => setAuthenticated(false));
  }, []);

  async function updateCommentStatus(
    id: string,
    status: StudioComment["status"]
  ) {
    setNotice("");
    const response = await fetch(`/api/studio/comments/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setNotice("评论状态更新失败。");
      return;
    }

    await loadStudioData();
  }

  async function updateMessageStatus(
    id: string,
    status: StudioMessage["status"]
  ) {
    setNotice("");
    const response = await fetch(`/api/studio/messages/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setNotice("聊天室消息状态更新失败。");
      return;
    }

    await loadStudioData();
  }

  async function logout() {
    await fetch("/api/studio/logout", { method: "POST" });
    setAuthenticated(false);
    setComments([]);
    setMessages([]);
  }

  if (!authenticated) {
    return (
      <form
        className="mt-10 max-w-md rounded-lg border border-border bg-card p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          const response = await fetch("/api/studio/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ password }),
          });

          if (!response.ok) {
            setError("密码不正确，或生产环境还没有配置 Studio 登录密钥。");
            return;
          }

          setAuthenticated(true);
          setPassword("");
          await loadStudioData();
        }}
      >
        <h2 className="text-2xl font-medium tracking-tight">Studio Login</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          开发环境默认密码是 studio。生产环境请使用 STUDIO_PASSWORD_HASH 和
          STUDIO_SESSION_SECRET。
        </p>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="Studio password"
          className="mt-5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        <button className="mt-4 rounded-full bg-foreground px-5 py-2 text-sm text-background">
          Login
        </button>
      </form>
    );
  }

  return (
    <div className="mt-10 grid gap-8">
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
              Owner Studio
            </p>
            <h2 className="mt-2 text-3xl font-medium tracking-tight">
              互动运营后台
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadStudioData()}
              className="rounded-full border border-border px-4 py-2 text-sm"
            >
              {loading ? "Refreshing" : "Refresh"}
            </button>
            <button
              onClick={() => logout()}
              className="rounded-full border border-border px-4 py-2 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
        {notice ? (
          <p className="mt-4 rounded-md bg-background px-3 py-2 text-sm text-muted-foreground">
            {notice}
          </p>
        ) : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Comments
            </p>
            <p className="mt-2 text-2xl">{comments.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {commentStats.visible} visible / {commentStats.hidden} hidden /{" "}
              {commentStats.deleted} deleted
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Room Messages
            </p>
            <p className="mt-2 text-2xl">{messages.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {messageStats.visible} visible / {messageStats.hidden} hidden /{" "}
              {messageStats.deleted} deleted
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Policy
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              hidden 用于临时隐藏，deleted 用于删除展示。生产环境建议保留审计记录。
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-3xl font-medium tracking-tight">Comments</h2>
        <p className="text-sm text-muted-foreground">{comments.length} records</p>
        <div className="mt-5 divide-y divide-border">
          {comments.map((comment) => (
            <article key={comment.id} className="py-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{comment.nickname}</span>
                <span>
                  {comment.postType}/{comment.postSlug}
                </span>
                {comment.parentId ? <span>reply</span> : <span>root</span>}
                <span>{formatDate(comment.createdAt)}</span>
                <span>{comment.status}</span>
                <span>{comment.likeCount} likes</span>
              </div>
              <p className="mt-2 text-sm leading-6">{comment.content}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["visible", "hidden", "deleted"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateCommentStatus(comment.id, status)}
                    className={[
                      "rounded-full border px-3 py-1 text-xs transition hover:bg-accent",
                      comment.status === status
                        ? "border-foreground"
                        : "border-border",
                    ].join(" ")}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-3xl font-medium tracking-tight">Room Messages</h2>
        <p className="text-sm text-muted-foreground">{messages.length} records</p>
        <div className="mt-5 divide-y divide-border">
          {messages.map((message) => (
            <article key={message.id} className="py-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{message.nickname}</span>
                <span>{message.roomId}</span>
                <span>{formatDate(message.createdAt)}</span>
                <span>{message.status}</span>
              </div>
              <p className="mt-2 text-sm leading-6">{message.content}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["visible", "hidden", "deleted"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateMessageStatus(message.id, status)}
                    className={[
                      "rounded-full border px-3 py-1 text-xs transition hover:bg-accent",
                      message.status === status
                        ? "border-foreground"
                        : "border-border",
                    ].join(" ")}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
