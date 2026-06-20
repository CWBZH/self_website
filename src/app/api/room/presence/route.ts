import {
  getOrCreateVisitorId,
  listRoomPresence,
  upsertRoomPresence,
  type StoredPresence,
} from "@/lib/server/personal-room-store";
import { publicInteractionsEnabled } from "@/lib/public-interactions";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function toPublicPresence(member: StoredPresence) {
  return {
    nickname: member.nickname,
    avatarSeed: member.avatarSeed,
    lastSeenAt: member.lastSeenAt,
  };
}

export async function GET(request: Request) {
  if (!publicInteractionsEnabled) {
    return NextResponse.json({ members: [], onlineCount: 0 });
  }

  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId") ?? "main";
  const members = await listRoomPresence(roomId);

  return NextResponse.json({
    members: members.map(toPublicPresence),
    onlineCount: members.length,
  });
}

export async function POST(request: Request) {
  if (!publicInteractionsEnabled) {
    return NextResponse.json({ error: "PUBLIC_INTERACTIONS_DISABLED" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const visitorId = getOrCreateVisitorId(request);
  await upsertRoomPresence({
    roomId: body?.roomId,
    nickname: body?.nickname,
    visitorId,
  });

  const members = await listRoomPresence(body?.roomId || "main");
  const response = NextResponse.json({
    members: members.map(toPublicPresence),
    onlineCount: members.length,
  });

  response.cookies.set("visitor_id", visitorId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
