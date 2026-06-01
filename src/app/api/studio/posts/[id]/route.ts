import {
  deleteCmsPost,
  getCmsPostById,
  updateCmsPost,
} from "@/lib/server/content-store";
import { isStudioRequest, unauthorized } from "@/lib/server/studio-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  const { id } = await context.params;
  const post = await getCmsPostById(id);

  if (!post) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const post = await updateCmsPost(id, body ?? {});

  if (!post) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  const { id } = await context.params;
  const deleted = await deleteCmsPost(id);

  if (!deleted) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
