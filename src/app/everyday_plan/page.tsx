import type { Metadata } from "next";
import { listEverydayPlans } from "@/lib/server/everyday-plan-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "每日计划",
  description: "个人每日计划入口。",
  robots: {
    index: false,
    follow: false,
  },
};

function EmptyState() {
  return (
    <section className="rounded-[2rem] border border-foreground/10 bg-foreground/[0.03] p-8">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
        Empty
      </p>
      <h2 className="mt-4 text-3xl font-medium tracking-tight">还没有每日计划</h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        让 Codex 调用写入接口后，这里会显示最新计划和历史记录。
      </p>
    </section>
  );
}

export default async function EverydayPlanPage() {
  const plans = await listEverydayPlans();
  const [latest, ...history] = plans;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12 md:py-20">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Everyday Plan
          </p>
          <h1 className="mt-4 text-5xl font-medium tracking-tight md:text-7xl">
            每日计划
          </h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            Codex 每天早上写入的个人计划会保存在这里。这个入口不出现在公开导航里。
          </p>
        </div>
      </div>

      <div className="mt-12">
        {latest ? (
          <section className="rounded-[2rem] border border-foreground/10 bg-foreground/[0.03] p-6 md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                  {latest.date}
                </p>
                <h2 className="mt-3 text-4xl font-medium tracking-tight md:text-6xl">
                  {latest.title}
                </h2>
              </div>
              <p className="rounded-full border border-foreground/10 px-4 py-2 text-sm text-muted-foreground">
                最新计划
              </p>
            </div>

            {latest.focus ? (
              <div className="mt-8 rounded-3xl bg-background p-5">
                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  今日重点
                </p>
                <p className="mt-3 text-xl leading-relaxed">{latest.focus}</p>
              </div>
            ) : null}

            {latest.blocks.length ? (
              <div className="mt-8">
                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  时间块
                </p>
                <div className="mt-4 grid gap-3">
                  {latest.blocks.map((block, index) => (
                    <div
                      key={`${block.time}-${index}`}
                      className="grid gap-2 rounded-3xl border border-foreground/10 bg-background p-5 md:grid-cols-[180px_1fr]"
                    >
                      <p className="font-mono text-sm text-muted-foreground">{block.time}</p>
                      <p className="text-lg">{block.task}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {latest.todo.length ? (
              <div className="mt-8">
                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  待办
                </p>
                <ul className="mt-4 grid gap-3">
                  {latest.todo.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="rounded-3xl border border-foreground/10 bg-background p-5"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {latest.review ? (
              <div className="mt-8 rounded-3xl bg-background p-5">
                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  复盘
                </p>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed">{latest.review}</p>
              </div>
            ) : null}
          </section>
        ) : (
          <EmptyState />
        )}
      </div>

      {history.length ? (
        <section className="mt-12">
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
            History
          </p>
          <div className="mt-4 grid gap-3">
            {history.map((plan) => (
              <article
                key={plan.date}
                className="rounded-3xl border border-foreground/10 p-5 transition hover:bg-foreground/[0.03]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm text-muted-foreground">{plan.date}</p>
                    <h3 className="mt-1 text-xl font-medium">{plan.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan.blocks.length} 个时间块 / {plan.todo.length} 个待办
                  </p>
                </div>
                {plan.focus ? (
                  <p className="mt-3 line-clamp-2 text-muted-foreground">{plan.focus}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
