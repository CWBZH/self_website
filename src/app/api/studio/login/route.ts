import {
  setStudioCookie,
  studioAuthConfigured,
  verifyStudioPassword,
} from "@/lib/server/studio-auth";
import { checkRateLimit, pruneRateLimitBuckets } from "@/lib/server/rate-limit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  pruneRateLimitBuckets();

  const limit = checkRateLimit({
    key: `studio-login:${ip}`,
    limit: 8,
    windowMs: 10 * 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  if (!studioAuthConfigured()) {
    return NextResponse.json({ error: "STUDIO_NOT_CONFIGURED" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const password = String(body?.password ?? "");

  if (!verifyStudioPassword(password)) {
    return NextResponse.json({ error: "INVALID_PASSWORD" }, { status: 401 });
  }

  return setStudioCookie(NextResponse.json({ ok: true }));
}
