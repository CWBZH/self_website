import { clearStudioCookie } from "@/lib/server/studio-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return clearStudioCookie(NextResponse.json({ ok: true }));
}
