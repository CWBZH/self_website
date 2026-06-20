import {
  createComment,
  getIpHash,
  getOrCreateVisitorId,
  listVisibleComments,
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

export async function GET(request: Request) {
  if (!publicInteractionsEnabled) {
    return NextResponse.json({ comments: [] });
  }

  const url = new URL(request.url);
  const postType = url.searchParams.get("postType") ?? "";
  const postSlug = url.searchParams.get("postSlug") ?? "";
  const visitorId = getOrCreateVisitorId(request);

  const comments = await listVisibleComments(postType, postSlug);

  return NextResponse.json({
    comments: comments.map((comment) => toPublicComment(comment, visitorId)),
  });
}

export async function POST(request: Request) {
  if (!publicInteractionsEnabled) {
    return NextResponse.json({ error: "PUBLIC_INTERACTIONS_DISABLED" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const visitorId = getOrCreateVisitorId(request);
  const ipHash = getIpHash(request);
  pruneRateLimitBuckets();

  const limit = checkRateLimit({
    key: `comment:${visitorId}:${ipHash}`,
    limit: 4,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  try {
    const comment = await createComment({
      postType: body?.postType,
      postSlug: body?.postSlug,
      parentId: body?.parentId,
      nickname: body?.nickname,
      content: body?.content,
      visitorId,
      ipHash,
    });

    const response = NextResponse.json(
      { comment: toPublicComment(comment, visitorId) },
      { status: 201 }
    );
    response.cookies.set("visitor_id", visitorId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "INVALID_COMMENT" }, { status: 400 });
  }
}
