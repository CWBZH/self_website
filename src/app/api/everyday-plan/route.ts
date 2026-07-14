import { NextResponse } from "next/server";
import {
  listEverydayPlans,
  upsertEverydayPlan,
} from "@/lib/server/everyday-plan-store";

export const runtime = "nodejs";

export async function GET() {
  const plans = await listEverydayPlans();
  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  try {
    const plan = await upsertEverydayPlan(body ?? {});
    return NextResponse.json({ ok: true, plan }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "INVALID_EVERYDAY_PLAN" }, { status: 400 });
  }
}
