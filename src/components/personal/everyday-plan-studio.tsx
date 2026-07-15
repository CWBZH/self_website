"use client";

import type { EverydayPlan, EverydayPlanBlock } from "@/lib/server/everyday-plan-store";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type PlanDraft = {
  date: string;
  title: string;
  dayType: string;
  focus: string;
  mostImportant: string;
  detailMarkdown: string;
  blocks: EverydayPlanBlock[];
  todo: string[];
  review: string;
  locked: boolean;
};

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring";

function shanghaiToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function emptyDraft(): PlanDraft {
  return {
    date: shanghaiToday(),
    title: "今日计划",
    dayType: "",
    focus: "",
    mostImportant: "",
    detailMarkdown: "",
    blocks: [{ time: "", task: "" }],
    todo: [""],
    review: "",
    locked: true,
  };
}

function planToDraft(plan: EverydayPlan): PlanDraft {
  return {
    date: plan.date,
    title: plan.title,
    dayType: plan.dayType,
    focus: plan.focus,
    mostImportant: plan.mostImportant,
    detailMarkdown: plan.detailMarkdown,
    blocks: plan.blocks.length ? plan.blocks : [{ time: "", task: "" }],
    todo: plan.todo.length ? plan.todo.map((item) => item.text) : [""],
    review: plan.review,
    locked: plan.locked,
  };
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function EverydayPlanStudio() {
  const [plans, setPlans] = useState<EverydayPlan[]>([]);
  const [draft, setDraft] = useState<PlanDraft>(() => emptyDraft());
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPlans() {
      const response = await fetch("/api/studio/everyday-plans");
      const data = (await response.json().catch(() => null)) as { plans?: EverydayPlan[] } | null;

      if (!active) return;
      if (!response.ok) {
        setStatus(response.status === 401 ? "后台登录已过期，请重新登录。" : "读取计划失败。");
        return;
      }

      const nextPlans = data?.plans ?? [];
      setPlans(nextPlans);
      const todayPlan = nextPlans.find((plan) => plan.date === shanghaiToday());
      if (todayPlan) setDraft(planToDraft(todayPlan));
    }

    loadPlans();
    return () => {
      active = false;
    };
  }, []);

  function updateDraft<K extends keyof PlanDraft>(key: K, value: PlanDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateBlock(index: number, key: keyof EverydayPlanBlock, value: string) {
    updateDraft(
      "blocks",
      draft.blocks.map((block, blockIndex) =>
        blockIndex === index ? { ...block, [key]: value } : block
      )
    );
  }

  function updateTodo(index: number, value: string) {
    updateDraft(
      "todo",
      draft.todo.map((item, itemIndex) => (itemIndex === index ? value : item))
    );
  }

  async function savePlan(event: FormEvent) {
    event.preventDefault();
    setStatus("");

    const todo = draft.todo.map((item) => item.trim()).filter(Boolean);
    const blocks = draft.blocks.filter((block) => block.time.trim() || block.task.trim());

    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) {
      setStatus("请选择有效日期。");
      return;
    }
    if (!draft.focus.trim() && !draft.detailMarkdown.trim() && todo.length === 0) {
      setStatus("至少填写今日重点、计划详情或一项待办。");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/studio/everyday-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, todo, blocks, source: "manual" }),
      });
      const data = (await response.json().catch(() => null)) as { plan?: EverydayPlan } | null;

      if (!response.ok || !data?.plan) {
        setStatus(response.status === 401 ? "后台登录已过期，请重新登录。" : "保存失败，请检查内容。");
        return;
      }

      const saved = data.plan;
      setPlans((current) =>
        [saved, ...current.filter((plan) => plan.date !== saved.date)].sort((a, b) =>
          b.date.localeCompare(a.date)
        )
      );
      setDraft(planToDraft(saved));
      setStatus("计划已保存。前台刷新后即可查看。");
    } finally {
      setBusy(false);
    }
  }

  async function deletePlan() {
    if (!plans.some((plan) => plan.date === draft.date)) return;
    if (!window.confirm(`确定删除 ${draft.date} 的计划吗？此操作不可直接撤销。`)) return;

    setBusy(true);
    try {
      const response = await fetch(
        `/api/studio/everyday-plans/${encodeURIComponent(draft.date)}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        setStatus("删除失败，请稍后重试。");
        return;
      }
      setPlans((current) => current.filter((plan) => plan.date !== draft.date));
      setDraft(emptyDraft());
      setStatus("计划已删除。");
    } finally {
      setBusy(false);
    }
  }

  const exists = plans.some((plan) => plan.date === draft.date);

  return (
    <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
      <aside className="min-w-0 rounded-2xl border border-border p-3 sm:rounded-3xl sm:p-4">
        <button
          type="button"
          className="w-full rounded-full bg-foreground px-4 py-2 text-sm text-background transition hover:opacity-85"
          onClick={() => {
            setDraft(emptyDraft());
            setStatus("");
          }}
        >
          新建今日计划
        </button>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:grid lg:max-h-[72vh] lg:overflow-x-visible lg:overflow-y-auto lg:pb-0 lg:pr-1">
          {plans.map((plan) => (
            <button
              key={plan.date}
              type="button"
              onClick={() => {
                setDraft(planToDraft(plan));
                setStatus("");
              }}
              className={`min-w-[220px] rounded-2xl border p-4 text-left transition hover:bg-muted lg:min-w-0 ${
                draft.date === plan.date ? "border-foreground" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <span>{plan.date}</span>
                <span>{plan.locked ? "已锁定" : "可更新"}</span>
              </div>
              <strong className="mt-2 block line-clamp-2 text-sm font-medium">{plan.title}</strong>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {plan.mostImportant || plan.focus || "暂无重点"}
              </p>
            </button>
          ))}
          {plans.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              还没有计划，先从今天开始。
            </p>
          ) : null}
        </div>
      </aside>

      <form className="grid min-w-0 gap-6 rounded-2xl border border-border p-4 sm:rounded-3xl sm:p-5" onSubmit={savePlan}>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Daily plan editor</p>
          <h2 className="mt-2 text-2xl font-medium">{exists ? "编辑计划" : "新建计划"}</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm">日期<input type="date" className={inputClass} value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} /></label>
          <label className="grid gap-2 text-sm">标题<input className={inputClass} value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} /></label>
          <label className="grid gap-2 text-sm">今日类型<input className={inputClass} placeholder="例如：深度任务日" value={draft.dayType} onChange={(event) => updateDraft("dayType", event.target.value)} /></label>
        </div>

        <label className="grid gap-2 text-sm">今日最重要成果<input className={inputClass} value={draft.mostImportant} onChange={(event) => updateDraft("mostImportant", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">今日重点<textarea className={`${inputClass} min-h-24 leading-6`} value={draft.focus} onChange={(event) => updateDraft("focus", event.target.value)} /></label>

        <section className="grid gap-3 rounded-2xl bg-muted/35 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-medium">核心待办</h3>
              <p className="mt-1 text-xs text-muted-foreground">建议保留3—5项，用于勾选、进度和热力图。</p>
            </div>
            <button type="button" className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs" onClick={() => updateDraft("todo", [...draft.todo, ""])}><Plus className="size-3.5" />增加待办</button>
          </div>
          {draft.todo.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
              <input className={inputClass} placeholder={`待办 ${index + 1}`} value={item} onChange={(event) => updateTodo(index, event.target.value)} />
              <div className="flex gap-1">
                <button type="button" className="rounded-lg border border-border p-2 disabled:opacity-30" disabled={index === 0} onClick={() => updateDraft("todo", moveItem(draft.todo, index, -1))} aria-label="上移"><ChevronUp className="size-4" /></button>
                <button type="button" className="rounded-lg border border-border p-2 disabled:opacity-30" disabled={index === draft.todo.length - 1} onClick={() => updateDraft("todo", moveItem(draft.todo, index, 1))} aria-label="下移"><ChevronDown className="size-4" /></button>
                <button type="button" className="rounded-lg border border-red-300 p-2 text-red-600 disabled:opacity-30" disabled={draft.todo.length === 1} onClick={() => updateDraft("todo", draft.todo.filter((_, itemIndex) => itemIndex !== index))} aria-label="删除"><Trash2 className="size-4" /></button>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-3 rounded-2xl bg-muted/35 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="font-medium">时间块</h3><p className="mt-1 text-xs text-muted-foreground">时间和任务均可手工调整。</p></div>
            <button type="button" className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs" onClick={() => updateDraft("blocks", [...draft.blocks, { time: "", task: "" }])}><Plus className="size-3.5" />增加时间块</button>
          </div>
          {draft.blocks.map((block, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[150px_1fr_auto]">
              <input className={inputClass} placeholder="20:30 - 21:30" value={block.time} onChange={(event) => updateBlock(index, "time", event.target.value)} />
              <input className={inputClass} placeholder="这个时间段做什么" value={block.task} onChange={(event) => updateBlock(index, "task", event.target.value)} />
              <div className="flex gap-1">
                <button type="button" className="rounded-lg border border-border p-2 disabled:opacity-30" disabled={index === 0} onClick={() => updateDraft("blocks", moveItem(draft.blocks, index, -1))} aria-label="上移"><ChevronUp className="size-4" /></button>
                <button type="button" className="rounded-lg border border-border p-2 disabled:opacity-30" disabled={index === draft.blocks.length - 1} onClick={() => updateDraft("blocks", moveItem(draft.blocks, index, 1))} aria-label="下移"><ChevronDown className="size-4" /></button>
                <button type="button" className="rounded-lg border border-red-300 p-2 text-red-600 disabled:opacity-30" disabled={draft.blocks.length === 1} onClick={() => updateDraft("blocks", draft.blocks.filter((_, blockIndex) => blockIndex !== index))} aria-label="删除"><Trash2 className="size-4" /></button>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <label className="grid min-w-0 gap-2 text-sm">完整计划详情（Markdown）<textarea className="min-h-[420px] w-full min-w-0 rounded-2xl border border-border bg-background px-4 py-3 font-mono text-sm leading-7 outline-none focus:ring-2 focus:ring-ring" value={draft.detailMarkdown} onChange={(event) => updateDraft("detailMarkdown", event.target.value)} /></label>
          <div className="min-w-0 rounded-2xl border border-border p-4">
            <div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm font-medium">详情预览</h3><button type="button" className="text-xs text-muted-foreground underline underline-offset-4" onClick={() => setShowPreview((current) => !current)}>{showPreview ? "收起" : "展开"}</button></div>
            {showPreview ? <div className="prose prose-neutral max-w-none text-sm dark:prose-invert"><ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.detailMarkdown || "在左侧输入计划详情后，这里会显示预览。"}</ReactMarkdown></div> : null}
          </div>
        </section>

        <label className="grid gap-2 text-sm">当日复盘<textarea className={`${inputClass} min-h-28 leading-6`} value={draft.review} onChange={(event) => updateDraft("review", event.target.value)} /></label>
        <label className="flex items-start gap-3 rounded-2xl border border-border p-4 text-sm"><input type="checkbox" className="mt-1 size-4" checked={draft.locked} onChange={(event) => updateDraft("locked", event.target.checked)} /><span><strong className="block font-medium">锁定人工计划</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">锁定后，定时写入不会覆盖这一天的人工内容。</span></span></label>

        {status ? <p className="rounded-2xl border border-border bg-muted/45 px-4 py-3 text-sm text-muted-foreground">{status}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button disabled={busy} type="submit" className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition hover:opacity-85 disabled:opacity-50">{busy ? "保存中…" : "保存计划"}</button>
          {exists ? <button disabled={busy} type="button" className="rounded-full border border-red-300 px-5 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950" onClick={deletePlan}>删除计划</button> : null}
        </div>
      </form>
    </section>
  );
}
