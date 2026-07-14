"use client";

import type { EverydayPlan } from "@/lib/server/everyday-plan-store";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

const weekLabels = ["一", "二", "三", "四", "五", "六", "日"];

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDateKey(value: string, amount: number) {
  const date = parseDateKey(value);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(parseDateKey(value));
}

function formatCompletedTime(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function progressOf(plan?: EverydayPlan) {
  const total = plan?.todo.length ?? 0;
  const done = plan?.todo.filter((item) => item.done).length ?? 0;
  return { total, done, ratio: total ? done / total : 0 };
}

function heatClass(plan?: EverydayPlan) {
  if (!plan) return "border border-foreground/10 bg-transparent";
  const progress = progressOf(plan);

  if (progress.total === 0 || progress.ratio === 0) {
    return "bg-[#ddd6cc] dark:bg-[#3a342d]";
  }
  if (progress.ratio < 0.5) {
    return "bg-[#bcae9d] dark:bg-[#655849]";
  }
  if (progress.ratio < 1) {
    return "bg-[#806b56] dark:bg-[#a58c72]";
  }
  return "bg-foreground";
}

function monthDays(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const leading = (first.getDay() + 6) % 7;
  const count = new Date(year, month, 0).getDate();

  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      return `${monthKey}-${day}`;
    }),
  ];
}

function yearWeeks(today: string) {
  const end = parseDateKey(today);
  const start = new Date(end);
  start.setDate(start.getDate() - 364);
  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() - ((gridStart.getDay() + 6) % 7));
  const dayCount = Math.floor((end.getTime() - gridStart.getTime()) / 86_400_000) + 1;
  const weekCount = Math.ceil(dayCount / 7);

  return Array.from({ length: weekCount }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);
      return date <= end ? toDateKey(date) : null;
    })
  );
}

export function EverydayPlanDashboard({ initialPlans }: { initialPlans: EverydayPlan[] }) {
  const today = toDateKey(new Date());
  const initialDate = initialPlans[0]?.date ?? today;
  const [plans, setPlans] = useState(initialPlans);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [monthKey, setMonthKey] = useState(initialDate.slice(0, 7));
  const [busyTodo, setBusyTodo] = useState<string | null>(null);
  const [error, setError] = useState("");

  const plansByDate = useMemo(
    () => new Map(plans.map((plan) => [plan.date, plan])),
    [plans]
  );
  const selectedPlan = plansByDate.get(selectedDate);
  const selectedProgress = progressOf(selectedPlan);
  const calendarDays = useMemo(() => monthDays(monthKey), [monthKey]);
  const heatmapWeeks = useMemo(() => yearWeeks(today), [today]);

  const stats = useMemo(() => {
    const monthPlans = plans.filter((plan) => plan.date.startsWith(`${monthKey}-`));
    const monthTodo = monthPlans.flatMap((plan) => plan.todo);
    const monthDone = monthTodo.filter((item) => item.done).length;
    const completeDates = new Set(
      plans
        .filter((plan) => plan.todo.length > 0 && plan.todo.every((item) => item.done))
        .map((plan) => plan.date)
    );
    const sortedCompleteDates = [...completeDates].sort();
    let longest = 0;
    let run = 0;
    let previous = "";

    sortedCompleteDates.forEach((date) => {
      run = previous && shiftDateKey(previous, 1) === date ? run + 1 : 1;
      longest = Math.max(longest, run);
      previous = date;
    });

    let current = 0;
    let cursor = completeDates.has(today)
      ? today
      : completeDates.has(shiftDateKey(today, -1))
        ? shiftDateKey(today, -1)
        : "";

    while (cursor && completeDates.has(cursor)) {
      current += 1;
      cursor = shiftDateKey(cursor, -1);
    }

    return {
      current,
      longest,
      monthRate: monthTodo.length ? Math.round((monthDone / monthTodo.length) * 100) : 0,
    };
  }, [monthKey, plans, today]);

  function selectDate(date: string) {
    setSelectedDate(date);
    setMonthKey(date.slice(0, 7));
  }

  function moveMonth(amount: number) {
    const [year, month] = monthKey.split("-").map(Number);
    const next = new Date(year, month - 1 + amount, 1);
    setMonthKey(toDateKey(next).slice(0, 7));
  }

  async function toggleTodo(todoId: string, done: boolean) {
    if (!selectedPlan || busyTodo) return;

    const snapshot = plans;
    setBusyTodo(todoId);
    setError("");
    setPlans((current) =>
      current.map((plan) =>
        plan.date === selectedPlan.date
          ? {
              ...plan,
              todo: plan.todo.map((item) =>
                item.id === todoId
                  ? {
                      ...item,
                      done,
                      completedAt: done ? new Date().toISOString() : null,
                    }
                  : item
              ),
            }
          : plan
      )
    );

    try {
      const response = await fetch("/api/everyday-plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedPlan.date, todoId, done }),
      });
      const data = (await response.json().catch(() => null)) as { plan?: EverydayPlan } | null;

      if (!response.ok || !data?.plan) {
        throw new Error("SAVE_FAILED");
      }

      setPlans((current) =>
        current.map((plan) => (plan.date === data.plan?.date ? data.plan : plan))
      );
    } catch {
      setPlans(snapshot);
      setError("保存失败，请刷新后重试。");
    } finally {
      setBusyTodo(null);
    }
  }

  const monthLabel = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
  }).format(parseDateKey(`${monthKey}-01`));

  return (
    <main className="mx-auto w-full max-w-7xl py-5 sm:py-10">
      <header className="grid gap-6 border-b border-border pb-8 sm:grid-cols-[1fr_auto] sm:items-end sm:pb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Everyday Plan</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-6xl lg:text-7xl">每日计划</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            每一次勾选都会沉淀为一格颜色。这里不追求完美，只记录真实完成过的日子。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-[340px] sm:gap-3">
          {[
            [String(stats.current), "连续天数"],
            [`${stats.monthRate}%`, "本月完成"],
            [String(stats.longest), "最长连续"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-border p-3 text-center sm:p-4">
              <p className="text-xl font-medium sm:text-2xl">{value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-xs">{label}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:gap-6">
        <div className="rounded-[1.75rem] border border-border p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{formatDate(selectedDate)}</p>
              <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-4xl">
                {selectedPlan?.title ?? "这一天还没有计划"}
              </h2>
            </div>
            {selectedPlan ? (
              <p className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
                {selectedProgress.done} / {selectedProgress.total} 完成
              </p>
            ) : null}
          </div>

          {selectedPlan ? (
            <>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-[width] duration-500"
                  style={{ width: `${selectedProgress.ratio * 100}%` }}
                />
              </div>

              {selectedPlan.focus ? (
                <div className="mt-6 rounded-2xl bg-muted/55 p-4 sm:p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">今日重点</p>
                  <p className="mt-2 text-base leading-7 sm:text-lg">{selectedPlan.focus}</p>
                </div>
              ) : null}

              <div className="mt-7">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">待办事项</p>
                <div className="mt-3 grid gap-2.5">
                  {selectedPlan.todo.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={Boolean(busyTodo)}
                      onClick={() => toggleTodo(item.id, !item.done)}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-border p-3.5 text-left transition hover:bg-muted/50 disabled:cursor-wait disabled:opacity-65 sm:p-4"
                      aria-pressed={item.done}
                    >
                      <span className={`grid size-6 shrink-0 place-items-center rounded-full border transition ${item.done ? "border-foreground bg-foreground text-background" : "border-foreground/25 group-hover:border-foreground"}`}>
                        {item.done ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
                      </span>
                      <span className={`min-w-0 flex-1 text-sm leading-6 sm:text-base ${item.done ? "text-muted-foreground line-through" : ""}`}>
                        {item.text}
                      </span>
                      {item.completedAt ? (
                        <span className="hidden text-xs text-muted-foreground sm:block">{formatCompletedTime(item.completedAt)}</span>
                      ) : null}
                    </button>
                  ))}
                  {selectedPlan.todo.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">今天没有可勾选的待办。</p>
                  ) : null}
                </div>
              </div>

              {selectedPlan.blocks.length ? (
                <div className="mt-8">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">时间块</p>
                  <div className="mt-3 grid gap-2.5">
                    {selectedPlan.blocks.map((block, index) => (
                      <div key={`${block.time}-${index}`} className="grid gap-1 rounded-2xl bg-muted/45 p-4 sm:grid-cols-[150px_1fr] sm:gap-4">
                        <p className="font-mono text-xs text-muted-foreground sm:text-sm">{block.time}</p>
                        <p className="text-sm leading-6 sm:text-base">{block.task}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedPlan.review ? (
                <div className="mt-8 border-t border-border pt-6">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">复盘</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground sm:text-base">{selectedPlan.review}</p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-sm leading-6 text-muted-foreground">
              Codex 尚未为这一天写入计划。你可以在日历中选择其他有颜色的日期。
            </div>
          )}

          {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
        </div>

        <aside className="rounded-[1.75rem] border border-border p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => moveMonth(-1)} className="grid size-9 place-items-center rounded-full border border-border transition hover:bg-muted" aria-label="上个月">
              <ChevronLeft className="size-4" />
            </button>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Monthly record</p>
              <h2 className="mt-1 text-xl font-medium">{monthLabel}</h2>
            </div>
            <button type="button" onClick={() => moveMonth(1)} className="grid size-9 place-items-center rounded-full border border-border transition hover:bg-muted" aria-label="下个月">
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-1.5 text-center text-[10px] text-muted-foreground sm:gap-2 sm:text-xs">
            {weekLabels.map((label) => <span key={label}>{label}</span>)}
            {calendarDays.map((date, index) => date ? (
              <button
                key={date}
                type="button"
                title={`${date} · ${progressOf(plansByDate.get(date)).done}/${progressOf(plansByDate.get(date)).total}`}
                onClick={() => selectDate(date)}
                className={`relative aspect-square rounded-lg text-xs transition hover:scale-[1.04] sm:rounded-xl ${heatClass(plansByDate.get(date))} ${selectedDate === date ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""} ${progressOf(plansByDate.get(date)).ratio === 1 ? "text-background" : "text-foreground"}`}
              >
                {Number(date.slice(-2))}
                {date === today ? <span className="absolute inset-x-1 bottom-1 mx-auto h-0.5 rounded-full bg-current opacity-50" /> : null}
              </button>
            ) : <span key={`empty-${index}`} />)}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5 text-[10px] text-muted-foreground sm:text-xs">
            <span>少</span>
            {[undefined, { todo: [] }, { todo: [{ done: true }, { done: false }, { done: false }] }, { todo: [{ done: true }, { done: true }, { done: false }] }, { todo: [{ done: true }] }].map((sample, index) => {
              const plan = sample ? ({ todo: sample.todo } as EverydayPlan) : undefined;
              return <span key={index} className={`size-3 rounded-[3px] ${heatClass(plan)}`} />;
            })}
            <span>完成</span>
          </div>
        </aside>
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-border p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">365 days</p>
            <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">过去一年的完成痕迹</h2>
          </div>
          <p className="text-xs text-muted-foreground">横向滑动查看完整记录</p>
        </div>
        <div className="mt-6 overflow-x-auto pb-3">
          <div className="flex min-w-max gap-1">
            {heatmapWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-rows-7 gap-1">
                {week.map((date, dayIndex) => date ? (
                  <button
                    key={date}
                    type="button"
                    title={`${date} · ${progressOf(plansByDate.get(date)).done}/${progressOf(plansByDate.get(date)).total}`}
                    onClick={() => selectDate(date)}
                    className={`size-2.5 rounded-[3px] transition hover:scale-125 sm:size-3 ${heatClass(plansByDate.get(date))} ${selectedDate === date ? "ring-1 ring-foreground ring-offset-1 ring-offset-background" : ""}`}
                    aria-label={`查看 ${date}`}
                  />
                ) : <span key={`blank-${dayIndex}`} className="size-2.5 sm:size-3" />)}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
