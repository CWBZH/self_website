import {
  createMessage,
  getIpHash,
  getOrCreateVisitorId,
  listVisibleMessages,
  upsertRoomPresence,
  type StoredMessage,
} from "@/lib/server/personal-room-store";
import { publicInteractionsEnabled } from "@/lib/public-interactions";
import { checkRateLimit, pruneRateLimitBuckets } from "@/lib/server/rate-limit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function toPublicMessage(message: StoredMessage, visitorId: string) {
  return {
    id: message.id,
    roomId: message.roomId,
    nickname: message.nickname,
    avatarSeed: message.avatarSeed,
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    mine: message.visitorId === visitorId,
  };
}

export async function GET(request: Request) {
  if (!publicInteractionsEnabled) {
    return NextResponse.json({ messages: [] });
  }

  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId") ?? "main";
  const visitorId = getOrCreateVisitorId(request);
  const messages = await listVisibleMessages(roomId);

  return NextResponse.json({
    messages: messages.map((message) => toPublicMessage(message, visitorId)),
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
    key: `message:${visitorId}:${ipHash}`,
    limit: 12,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  try {
    const message = await createMessage({
      roomId: body?.roomId,
      nickname: body?.nickname,
      content: body?.content,
      visitorId,
      ipHash,
    });
    await upsertRoomPresence({
      roomId: body?.roomId,
      nickname: body?.nickname,
      visitorId,
    });

    const response = NextResponse.json(
      { message: toPublicMessage(message, visitorId) },
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
    return NextResponse.json({ error: "INVALID_MESSAGE" }, { status: 400 });
  }
}
