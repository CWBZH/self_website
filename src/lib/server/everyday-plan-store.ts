import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type EverydayPlanBlock = {
  time: string;
  task: string;
};

export type EverydayPlan = {
  date: string;
  title: string;
  focus: string;
  blocks: EverydayPlanBlock[];
  todo: string[];
  review: string;
  createdAt: string;
  updatedAt: string;
};

type EverydayPlanStore = {
  plans: EverydayPlan[];
};

const storePath = path.join(process.cwd(), "data", "everyday-plans.json");
const emptyStore: EverydayPlanStore = {
  plans: [],
};

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

  return new Date().toISOString().slice(0, 10);
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

function normalizeTodo(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, 60)
    .map((item) => clampText(item, 280))
    .filter(Boolean);
}

function normalizePlan(input: unknown, existing?: EverydayPlan): EverydayPlan {
  const source = (input ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  const date = normalizeDate(source.date ?? existing?.date);
  const title = clampText(source.title, 120, existing?.title || "今日计划");
  const focus = clampText(source.focus, 800, existing?.focus || "");
  const blocks = normalizeBlocks(source.blocks ?? existing?.blocks);
  const todo = normalizeTodo(source.todo ?? existing?.todo);
  const review = clampText(source.review, 8000, existing?.review || "");

  return {
    date,
    title: title || "今日计划",
    focus,
    blocks,
    todo,
    review,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

async function ensureStore() {
  await mkdir(path.dirname(storePath), { recursive: true });
}

async function readStore(): Promise<EverydayPlanStore> {
  await ensureStore();

  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<EverydayPlanStore>;

    return {
      plans: Array.isArray(parsed.plans) ? parsed.plans : [],
    };
  } catch {
    await writeStore(emptyStore);
    return emptyStore;
  }
}

async function writeStore(store: EverydayPlanStore) {
  await ensureStore();
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
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
  const incomingDate = normalizeDate((input as { date?: unknown } | null)?.date);
  const existingIndex = store.plans.findIndex((item) => item.date === incomingDate);
  const existing = existingIndex >= 0 ? store.plans[existingIndex] : undefined;
  const plan = normalizePlan({ ...(input as Record<string, unknown>), date: incomingDate }, existing);

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
