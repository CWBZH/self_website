import { ContactFooter } from "@/components/personal/contact-footer";
import { PostList } from "@/components/personal/post-list";
import { getPostsByType } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journal",
  description: "正式文章、长篇随笔、技术记录和完整思考。",
};

export default function JournalPage() {
  const posts = getPostsByType("journal");

  return (
    <main id="top">
      <section className="py-10 md:py-16">
        <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
          Journal
        </p>
        <h1 className="mt-5 max-w-5xl text-balance text-6xl font-medium leading-none tracking-tight md:text-8xl">
          长文章、项目复盘和完整思考。
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
          这里放正式内容。页面可以有轻微进入感，但阅读本身保持安静。
        </p>
      </section>
      <PostList posts={posts} eyebrow="Journal" />
      <ContactFooter />
    </main>
  );
}
