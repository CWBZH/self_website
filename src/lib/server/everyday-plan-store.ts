import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export type EverydayPlanBlock = {
  time: string;
  task: string;
};

export type EverydayPlanTodo = {
  id: string;
  text: string;
  done: boolean;
  completedAt: string | null;
};

export type EverydayPlanSource = "manual" | "scheduled";

export type EverydayPlan = {
  date: string;
  title: string;
  dayType: string;
  focus: string;
  mostImportant: string;
  detailMarkdown: string;
  blocks: EverydayPlanBlock[];
  todo: EverydayPlanTodo[];
  review: string;
  source: EverydayPlanSource;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
};

type EverydayPlanStore = {
  plans: EverydayPlan[];
};

const storePath = path.join(process.cwd(), "data", "everyday-plans.json");
const backupDirectory = path.join(process.cwd(), "data", "everyday-plan-backups");
const backupLimit = 200;
const emptyStore: EverydayPlanStore = {
  plans: [],
};

export function shanghaiDateKey(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function cleanText(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function clampText(value: unknown, maxLength: number, fallback = "") {
  return cleanText(value, fallback).slice(0, maxLength);
}

function normalizeDate(value: unknown) {
  const raw = cleanText(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  return shanghaiDateKey();
}

function normalizeSource(value: unknown, fallback: EverydayPlanSource = "manual") {
  return value === "scheduled" || value === "manual" ? value : fallback;
}

function normalizeBlocks(value: unknown): EverydayPlanBlock[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, 24)
    .map((item) => ({
      time: clampText((item as { time?: unknown })?.time, 60),
      task: clampText((item as { task?: unknown })?.task, 280),
    }))
    .filter((item) => item.time || item.task);
}

function createTodoId(text: string, index: number) {
  let hash = 0;

  for (let cursor = 0; cursor < text.length; cursor += 1) {
    hash = (hash * 31 + text.charCodeAt(cursor)) | 0;
  }

  return `todo-${index}-${Math.abs(hash).toString(36)}`;
}

function normalizeTodo(
  value: unknown,
  existing: EverydayPlanTodo[] = []
): EverydayPlanTodo[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, 60)
    .map((item, index) => {
      const source = typeof item === "string" ? { text: item } : (item ?? {}) as Record<string, unknown>;
      const text = clampText(source.text, 280);

      if (!text) {
        return null;
      }

      const requestedId = clampText(source.id, 120);
      const previous = existing.find((entry) => entry.id === requestedId)
        ?? existing.find((entry) => entry.text === text);
      const id = requestedId || previous?.id || createTodoId(text, index);
      const done = typeof source.done === "boolean" ? source.done : previous?.done ?? false;
      const completedAt = done
        ? clampText(source.completedAt, 80, previous?.completedAt || "") || null
        : null;

      return { id, text, done, completedAt };
    })
    .filter((item): item is EverydayPlanTodo => Boolean(item));
}

function normalizePlan(input: unknown, existing?: EverydayPlan): EverydayPlan {
  const source = (input ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  const date = normalizeDate(source.date ?? existing?.date);
  const title = clampText(source.title, 120, existing?.title || "今日计划");
  const dayType = clampText(source.dayType, 80, existing?.dayType || "");
  const focus = clampText(source.focus, 800, existing?.focus || "");
  const mostImportant = clampText(
    source.mostImportant,
    400,
    existing?.mostImportant || ""
  );
  const detailMarkdown = clampText(
    source.detailMarkdown,
    50_000,
    existing?.detailMarkdown || ""
  );
  const blocks = normalizeBlocks(source.blocks ?? existing?.blocks);
  const todo = normalizeTodo(source.todo ?? existing?.todo, existing?.todo);
  const review = clampText(source.review, 8000, existing?.review || "");
  const planSource = normalizeSource(source.source, existing?.source || "manual");
  const locked = typeof source.locked === "boolean" ? source.locked : existing?.locked ?? false;

  return {
    date,
    title: title || "今日计划",
    dayType,
    focus,
    mostImportant,
    detailMarkdown,
    blocks,
    todo,
    review,
    source: planSource,
    locked,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

function normalizeStoredPlan(value: unknown): EverydayPlan | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const now = new Date().toISOString();
  const createdAt = clampText(source.createdAt, 80, now);

  return {
    date: normalizeDate(source.date),
    title: clampText(source.title, 120, "今日计划") || "今日计划",
    dayType: clampText(source.dayType, 80),
    focus: clampText(source.focus, 800),
    mostImportant: clampText(source.mostImportant, 400),
    detailMarkdown: clampText(source.detailMarkdown, 50_000),
    blocks: normalizeBlocks(source.blocks),
    todo: normalizeTodo(source.todo),
    review: clampText(source.review, 8000),
    source: normalizeSource(source.source),
    locked: source.locked === true,
    createdAt,
    updatedAt: clampText(source.updatedAt, 80, createdAt),
  };
}

async function ensureStore() {
  await mkdir(path.dirname(storePath), { recursive: true });
  await mkdir(backupDirectory, { recursive: true });
}

async function readStore(): Promise<EverydayPlanStore> {
  await ensureStore();

  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as { plans?: unknown[] };

    return {
      plans: Array.isArray(parsed.plans)
        ? parsed.plans
            .map(normalizeStoredPlan)
            .filter((plan): plan is EverydayPlan => Boolean(plan))
        : [],
    };
  } catch {
    await writeStore(emptyStore);
    return emptyStore;
  }
}

async function writeStore(store: EverydayPlanStore) {
  await ensureStore();
  const serialized = `${JSON.stringify(store, null, 2)}\n`;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const temporaryPath = `${storePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    const previous = await readFile(storePath, "utf8");
    await writeFile(
      path.join(backupDirectory, `everyday-plans-${timestamp}.json`),
      previous,
      "utf8"
    );
  } catch {
    // The first write has no previous version to back up.
  }

  await writeFile(temporaryPath, serialized, "utf8");
  await rename(temporaryPath, storePath);

  const backups = (await readdir(backupDirectory))
    .filter((name) => name.startsWith("everyday-plans-") && name.endsWith(".json"))
    .sort()
    .reverse();

  await Promise.all(
    backups.slice(backupLimit).map((name) =>
      unlink(path.join(backupDirectory, name)).catch(() => undefined)
    )
  );
}

export async function listEverydayPlans() {
  const store = await readStore();

  return [...store.plans].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getLatestEverydayPlan() {
  const [latest] = await listEverydayPlans();
  return latest ?? null;
}

export async function upsertEverydayPlan(input: unknown) {
  const store = await readStore();
  const source = (input ?? {}) as Record<string, unknown>;
  const incomingDate = normalizeDate(source.date);
  const existingIndex = store.plans.findIndex((item) => item.date === incomingDate);
  const existing = existingIndex >= 0 ? store.plans[existingIndex] : undefined;
  const incomingSource = normalizeSource(source.source, existing?.source || "manual");

  if (existing?.locked && incomingSource === "scheduled" && source.force !== true) {
    throw new Error("EVERYDAY_PLAN_LOCKED");
  }

  const plan = normalizePlan({ ...source, date: incomingDate, source: incomingSource }, existing);

  if (!plan.focus && plan.blocks.length === 0 && plan.todo.length === 0 && !plan.review) {
    throw new Error("EMPTY_EVERYDAY_PLAN");
  }

  if (existingIndex >= 0) {
    store.plans[existingIndex] = plan;
  } else {
    store.plans.unshift(plan);
  }

  store.plans = store.plans
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 400);

  await writeStore(store);
  return plan;
}

export async function deleteEverydayPlan(date: string) {
  const normalizedDate = normalizeDate(date);
  const store = await readStore();
  const nextPlans = store.plans.filter((plan) => plan.date !== normalizedDate);

  if (nextPlans.length === store.plans.length) {
    return false;
  }

  store.plans = nextPlans;
  await writeStore(store);
  return true;
}

export async function updateEverydayPlanTodo(
  date: string,
  todoId: string,
  done: boolean
) {
  const store = await readStore();
  const planIndex = store.plans.findIndex((plan) => plan.date === date);

  if (planIndex < 0) {
    throw new Error("EVERYDAY_PLAN_NOT_FOUND");
  }

  const plan = store.plans[planIndex];
  const todoIndex = plan.todo.findIndex((item) => item.id === todoId);

  if (todoIndex < 0) {
    throw new Error("EVERYDAY_PLAN_TODO_NOT_FOUND");
  }

  const current = plan.todo[todoIndex];
  plan.todo[todoIndex] = {
    ...current,
    done,
    completedAt: done ? current.completedAt || new Date().toISOString() : null,
  };
  plan.updatedAt = new Date().toISOString();
  store.plans[planIndex] = plan;

  await writeStore(store);
  return plan;
}
