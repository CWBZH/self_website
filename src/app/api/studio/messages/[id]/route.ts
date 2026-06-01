import {
  type MessageStatus,
  purgeMessage,
  updateMessageStatus,
} from "@/lib/server/personal-room-store";
import { isStudioRequest, unauthorized } from "@/lib/server/studio-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const statuses: MessageStatus[] = ["visible", "hidden", "deleted"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const status = body?.status as MessageStatus;

  if (!statuses.includes(status)) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }

  const message = await updateMessageStatus(id, status);

  if (!message) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ message });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  const { id } = await context.params;
  const message = await purgeMessage(id);

  if (!message) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, message });
}
