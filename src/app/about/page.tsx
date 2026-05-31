import { ContactFooter } from "@/components/personal/contact-footer";
import { DATA } from "@/data/resume";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "关于这个个人数字空间。",
};

export default function AboutPage() {
  return (
    <main id="top">
      <section className="grid gap-10 py-10 md:grid-cols-[0.85fr_1.15fr] md:py-16">
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
            About
          </p>
          <h1 className="mt-5 text-balance text-6xl font-medium leading-none tracking-tight md:text-8xl">
            不是简历，不是作品集，是个人数字客厅。
          </h1>
        </div>
        <div className="self-end space-y-6 text-lg leading-8 text-muted-foreground">
          <p>{DATA.description}</p>
          <p>
            Journal 放正式文章，Notes 放短想法，Room 留给访客聊天，Garden
            则藏在页脚那个小句号后面。
          </p>
          <p>
            第一阶段先确定信息结构和体验节奏；后续再接评论、聊天室实时后端和站长
            Studio。
          </p>
        </div>
      </section>
      <ContactFooter />
    </main>
  );
}
