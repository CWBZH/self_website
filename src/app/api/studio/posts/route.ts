import { createCmsPost, listCmsPosts } from "@/lib/server/content-store";
import { isStudioRequest, unauthorized } from "@/lib/server/studio-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  const posts = await listCmsPosts({ includeDrafts: true });
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const post = await createCmsPost(body ?? {});

  return NextResponse.json({ post }, { status: 201 });
}
