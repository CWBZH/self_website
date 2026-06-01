import { ContactFooter } from "@/components/personal/contact-footer";
import { PostList } from "@/components/personal/post-list";
import { getContentPostsByType } from "@/lib/server/content-service";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notes",
  description: "短随笔、灵感、摘录和还没完全成形的想法。",
};

export default async function NotesPage() {
  const posts = await getContentPostsByType("note");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-24 md:px-8">
      <header className="mb-14 border-b border-border pb-10">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
          Notes
        </p>
        <h1 className="mt-4 max-w-4xl text-balance text-5xl font-medium tracking-tight md:text-7xl">
          更短、更轻、更接近日常的记录。
        </h1>
      </header>
      <PostList posts={posts} />
      <ContactFooter />
    </main>
  );
}
