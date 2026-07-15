import { EverydayPlanDashboard } from "@/components/personal/everyday-plan-dashboard";
import { listEverydayPlans, shanghaiDateKey } from "@/lib/server/everyday-plan-store";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "每日计划",
  description: "个人每日计划与完成记录。",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EverydayPlanPage() {
  const plans = await listEverydayPlans();

  return <EverydayPlanDashboard initialPlans={plans} today={shanghaiDateKey()} />;
}
