import { ContactFooter } from "@/components/personal/contact-footer";
import { PostList } from "@/components/personal/post-list";
import { getPostsByType } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notes",
  description: "短随笔、灵感、摘录和未完成但值得记录的内容。",
};

export default function NotesPage() {
  const posts = getPostsByType("note");

  return (
    <main id="top">
      <section className="py-10 md:py-16">
        <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
          Notes
        </p>
        <h1 className="mt-5 max-w-5xl text-balance text-6xl font-medium leading-none tracking-tight md:text-8xl">
          短随笔、灵感和未完成的片段。
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
          Notes 不需要像 Journal 一样庄重，但它们仍然是内容的一部分。
        </p>
      </section>
      <PostList posts={posts} eyebrow="Note" />
      <ContactFooter />
    </main>
  );
}
