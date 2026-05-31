import { listAllMessages } from "@/lib/server/personal-room-store";
import { isStudioRequest, unauthorized } from "@/lib/server/studio-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  const messages = await listAllMessages();
  return NextResponse.json({ messages });
}
