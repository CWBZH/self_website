import { NextResponse } from "next/server";
import {
  everydayPlanApiConfigured,
  verifyEverydayPlanApiToken,
} from "@/lib/server/everyday-plan-auth";
import {
  listEverydayPlans,
  upsertEverydayPlan,
} from "@/lib/server/everyday-plan-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!everydayPlanApiConfigured()) {
    return NextResponse.json({ error: "EVERYDAY_PLAN_API_NOT_CONFIGURED" }, { status: 503 });
  }

  if (!verifyEverydayPlanApiToken(request)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const plans = await listEverydayPlans();
  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  if (!everydayPlanApiConfigured()) {
    return NextResponse.json({ error: "EVERYDAY_PLAN_API_NOT_CONFIGURED" }, { status: 503 });
  }

  if (!verifyEverydayPlanApiToken(request)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  try {
    const plan = await upsertEverydayPlan(body ?? {});
    return NextResponse.json({ ok: true, plan }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "INVALID_EVERYDAY_PLAN" }, { status: 400 });
  }
}
