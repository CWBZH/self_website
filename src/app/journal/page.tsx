import { ContactFooter } from "@/components/personal/contact-footer";
import { PostList } from "@/components/personal/post-list";
import { getContentPostsByType } from "@/lib/server/content-service";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal",
  description: "长篇文章、正式随笔、技术记录和完整思考。",
};

export default async function JournalPage() {
  const posts = await getContentPostsByType("journal");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-24 md:px-8">
      <header className="mb-14 border-b border-border pb-10">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
          Journal
        </p>
        <h1 className="mt-4 max-w-4xl text-balance text-5xl font-medium tracking-tight md:text-7xl">
          长文章和完整思考。
        </h1>
      </header>
      <PostList posts={posts} />
      <ContactFooter />
    </main>
  );
}
