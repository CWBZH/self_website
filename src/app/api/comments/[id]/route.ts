import {
  deleteOwnComment,
  getIpHash,
  getOrCreateVisitorId,
  likeComment,
  type StoredComment,
} from "@/lib/server/personal-room-store";
import { publicInteractionsEnabled } from "@/lib/public-interactions";
import { checkRateLimit, pruneRateLimitBuckets } from "@/lib/server/rate-limit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function toPublicComment(comment: StoredComment, visitorId: string) {
  return {
    id: comment.id,
    postType: comment.postType,
    postSlug: comment.postSlug,
    parentId: comment.parentId,
    nickname: comment.nickname,
    avatarSeed: comment.avatarSeed,
    content: comment.content,
    likeCount: comment.likeCount,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    canDelete: comment.visitorId === visitorId,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!publicInteractionsEnabled) {
    return NextResponse.json({ error: "PUBLIC_INTERACTIONS_DISABLED" }, { status: 403 });
  }

  const visitorId = getOrCreateVisitorId(request);
  const ipHash = getIpHash(request);
  const { id } = await context.params;
  pruneRateLimitBuckets();

  const limit = checkRateLimit({
    key: `comment-like:${visitorId}:${ipHash}`,
    limit: 30,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const comment = await likeComment(id);

  if (!comment) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const response = NextResponse.json({
    comment: toPublicComment(comment, visitorId),
  });

  response.cookies.set("visitor_id", visitorId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!publicInteractionsEnabled) {
    return NextResponse.json({ error: "PUBLIC_INTERACTIONS_DISABLED" }, { status: 403 });
  }

  const visitorId = getOrCreateVisitorId(request);
  const { id } = await context.params;
  const comment = await deleteOwnComment(id, visitorId);

  if (!comment) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
