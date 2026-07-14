import { NextResponse } from "next/server";
import {
  listEverydayPlans,
  updateEverydayPlanTodo,
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

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    date?: unknown;
    todoId?: unknown;
    done?: unknown;
  } | null;
  const date = typeof body?.date === "string" ? body.date : "";
  const todoId = typeof body?.todoId === "string" ? body.todoId : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !todoId || typeof body?.done !== "boolean") {
    return NextResponse.json({ error: "INVALID_TODO_UPDATE" }, { status: 400 });
  }

  try {
    const plan = await updateEverydayPlanTodo(date, todoId, body.done);
    return NextResponse.json({ ok: true, plan });
  } catch {
    return NextResponse.json({ error: "TODO_NOT_FOUND" }, { status: 404 });
  }
}
