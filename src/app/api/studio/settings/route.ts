import { getSiteSettings, updateSiteSettings } from "@/lib/server/site-settings";
import { isStudioRequest, unauthorized } from "@/lib/server/studio-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const settings = await updateSiteSettings(body ?? {});
  return NextResponse.json({ settings });
}
