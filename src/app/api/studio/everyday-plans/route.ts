import { listEverydayPlans, upsertEverydayPlan } from "@/lib/server/everyday-plan-store";
import { isStudioRequest, unauthorized } from "@/lib/server/studio-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  return NextResponse.json({ plans: await listEverydayPlans() });
}

export async function POST(request: Request) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);

  try {
    const plan = await upsertEverydayPlan({
      ...((body ?? {}) as Record<string, unknown>),
      source: "manual",
    });
    return NextResponse.json({ ok: true, plan });
  } catch {
    return NextResponse.json({ error: "INVALID_EVERYDAY_PLAN" }, { status: 400 });
  }
}
