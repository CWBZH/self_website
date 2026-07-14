import { StudioDashboard } from "@/components/personal/studio-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio",
  description: "站长内容运营后台。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudioPage() {
  return (
    <main className="py-4 sm:py-8 md:py-12">
      <StudioDashboard />
    </main>
  );
}
