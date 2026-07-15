import { deleteEverydayPlan } from "@/lib/server/everyday-plan-store";
import { isStudioRequest, unauthorized } from "@/lib/server/studio-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ date: string }> }
) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  const { date } = await context.params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "INVALID_DATE" }, { status: 400 });
  }

  const deleted = await deleteEverydayPlan(date);
  return deleted
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}
