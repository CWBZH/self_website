"use client";

import { useEffect, useMemo, useState } from "react";

type CommentItem = {
  id: string;
  parentId: string | null;
  name: string;
  time: string;
  content: string;
  likeCount: number;
  canDelete: boolean;
};

type ApiComment = {
  id: string;
  parentId: string | null;
  nickname: string;
  createdAt: string;
  content: string;
  likeCount: number;
  canDelete: boolean;
};

type CommentBoxProps = {
  postType: string;
  postSlug: string;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toCommentItem(comment: ApiComment): CommentItem {
  return {
    id: comment.id,
    parentId: comment.parentId,
    name: comment.nickname,
    time: formatTime(comment.createdAt),
    content: comment.content,
    likeCount: comment.likeCount,
    canDelete: comment.canDelete,
  };
}

export function CommentBox({ postType, postSlug }: CommentBoxProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function loadComments() {
      const params = new URLSearchParams({ postType, postSlug });
      const response = await fetch(`/api/comments?${params.toString()}`);
      const data = (await response.json()) as { comments?: ApiComment[] };
      setComments((data.comments ?? []).map(toCommentItem));
    }

    loadComments().catch(() => {
      setComments([]);
      setStatus("评论暂时无法加载。");
    });
  }, [postSlug, postType]);

  const repliesByParent = useMemo(() => {
    const map = new Map<string, CommentItem[]>();

    comments.forEach((comment) => {
      if (!comment.parentId) return;
      const replies = map.get(comment.parentId) ?? [];
      replies.push(comment);
      map.set(comment.parentId, replies);
    });

    return map;
  }, [comments]);

  const rootComments = comments.filter((comment) => !comment.parentId);

  async function submitComment() {
    const safeName = name.trim() || "Guest";
    const safeContent = content.trim();
    if (!safeContent) return;

    setIsSending(true);
    setStatus("");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postType,
          postSlug,
          parentId: replyTo?.id,
          nickname: safeName,
          content: safeContent,
        }),
      });

      if (!response.ok) {
        setStatus(response.status === 429 ? "发送太频繁，稍后再试。" : "评论发送失败。");
        return;
      }

      const data = (await response.json()) as { comment?: ApiComment };
      const createdComment = data.comment;
      if (!createdComment) return;

      setComments((current) => [toCommentItem(createdComment), ...current]);
      setContent("");
      setReplyTo(null);
      setStatus("已发送。");
    } finally {
      setIsSending(false);
    }
  }

  async function like(commentId: string) {
    const response = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
      method: "PATCH",
    });

    if (!response.ok) return;

    const data = (await response.json()) as { comment?: ApiComment };
    const updatedComment = data.comment;
    if (!updatedComment) return;

    setComments((current) =>
      current.map((comment) =>
        comment.id === commentId
          ? { ...comment, likeCount: updatedComment.likeCount }
          : comment
      )
    );
  }

  async function remove(commentId: string) {
    const response = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setStatus("只能删除你自己发表的评论。");
      return;
    }

    setComments((current) =>
      current.filter(
        (comment) => comment.id !== commentId && comment.parentId !== commentId
      )
    );
    setStatus("评论已删除。");
  }

  function renderComment(comment: CommentItem, isReply = false) {
    const replies = repliesByParent.get(comment.id) ?? [];

    return (
      <article
        key={comment.id}
        className={[
          "grid gap-4 py-5",
          isReply ? "grid-cols-[32px_1fr] pl-6" : "grid-cols-[40px_1fr]",
        ].join(" ")}
      >
        <div
          className={[
            "grid place-items-center rounded-full bg-foreground text-background",
            isReply ? "size-8 text-xs" : "size-10 text-sm",
          ].join(" ")}
        >
          {comment.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="font-medium">{comment.name}</strong>
            <span className="text-xs text-muted-foreground">{comment.time}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {comment.content}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <button
              className="transition hover:text-foreground"
              onClick={() => setReplyTo(comment)}
              type="button"
            >
              Reply
            </button>
            <button
              className="transition hover:text-foreground"
              onClick={() => like(comment.id)}
              type="button"
            >
              Like {comment.likeCount > 0 ? comment.likeCount : ""}
            </button>
            {comment.canDelete ? (
              <button
                className="transition hover:text-foreground"
                onClick={() => remove(comment.id)}
                type="button"
              >
                Delete
              </button>
            ) : null}
          </div>
          {replies.length > 0 ? (
            <div className="mt-4 border-l border-border">
              {replies
                .slice()
                .reverse()
                .map((reply) => renderComment(reply, true))}
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <section className="mt-16 border-t border-border pt-8">
      <div className="mb-6 flex items-end justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
            Comments
          </p>
          <h2 className="mt-2 text-3xl font-medium tracking-tight">
            留下一点轻声回应
          </h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {comments.length} comments
        </span>
      </div>

      <form
        className="grid gap-3 rounded-lg border border-border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          submitComment();
        }}
      >
        {replyTo ? (
          <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-xs text-muted-foreground">
            <span>Replying to {replyTo.name}</span>
            <button
              className="transition hover:text-foreground"
              onClick={() => setReplyTo(null)}
              type="button"
            >
              Cancel
            </button>
          </div>
        ) : null}
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="昵称"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="写下你的想法..."
          rows={4}
          className="resize-none rounded-md border border-border bg-background px-3 py-2 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={isSending}
            className="w-fit rounded-full bg-foreground px-5 py-2 text-sm text-background transition hover:opacity-85 disabled:opacity-50"
          >
            {isSending ? "Sending" : replyTo ? "Reply" : "Send"}
          </button>
          {status ? (
            <span className="text-xs text-muted-foreground">{status}</span>
          ) : null}
        </div>
      </form>

      <div className="mt-6 divide-y divide-border">
        {rootComments.map((comment) => renderComment(comment))}
      </div>
    </section>
  );
}
