import { isStudioRequest } from "@/lib/server/studio-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return NextResponse.json({ authenticated: isStudioRequest(request) });
}
