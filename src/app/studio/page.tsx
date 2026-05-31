import { StudioDashboard } from "@/components/personal/studio-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio",
  description: "站长运营后台预留入口。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudioPage() {
  return (
    <main className="mx-auto max-w-5xl py-10 md:py-16">
      <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
        Studio
      </p>
      <h1 className="mt-5 text-balance text-6xl font-medium leading-none tracking-tight md:text-8xl">
        站长后台预留入口。
      </h1>
      <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
        第一阶段只保留页面位置。下一阶段这里会接管理员登录、评论管理、聊天室消息删除、封禁和慢速模式。
      </p>
      <StudioDashboard />
    </main>
  );
}
