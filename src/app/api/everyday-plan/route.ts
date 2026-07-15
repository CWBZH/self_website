import { NextResponse } from "next/server";
import {
  listEverydayPlans,
  updateEverydayPlanTodo,
  upsertEverydayPlan,
} from "@/lib/server/everyday-plan-store";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

function writeLimit(request: Request, action: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = `${action}:${forwardedFor || "unknown"}`;
  return checkRateLimit({ key, limit: 20, windowMs: 10 * 60 * 1000 });
}

function tooManyRequests() {
  return NextResponse.json({ error: "TOO_MANY_REQUESTS" }, { status: 429 });
}

export async function GET() {
  const plans = await listEverydayPlans();
  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  if (!writeLimit(request, "everyday-plan-post").allowed) {
    return tooManyRequests();
  }

  const body = await request.json().catch(() => null);

  try {
    const source = (body ?? {}) as Record<string, unknown>;
    const plan = await upsertEverydayPlan({
      ...source,
      source: source.source === "manual" ? "manual" : "scheduled",
    });
    return NextResponse.json({ ok: true, plan }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "EVERYDAY_PLAN_LOCKED") {
      return NextResponse.json({ error: "EVERYDAY_PLAN_LOCKED" }, { status: 409 });
    }
    return NextResponse.json({ error: "INVALID_EVERYDAY_PLAN" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!writeLimit(request, "everyday-plan-patch").allowed) {
    return tooManyRequests();
  }

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
