import {
  type CommentStatus,
  updateCommentStatus,
} from "@/lib/server/personal-room-store";
import { isStudioRequest, unauthorized } from "@/lib/server/studio-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const statuses: CommentStatus[] = ["visible", "hidden", "deleted"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const status = body?.status as CommentStatus;

  if (!statuses.includes(status)) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }

  const comment = await updateCommentStatus(id, status);

  if (!comment) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ comment });
}
