import { ContactFooter } from "@/components/personal/contact-footer";
import { PostList } from "@/components/personal/post-list";
import { getGardenContentPosts } from "@/lib/server/content-service";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Garden",
  description: "半隐藏的随笔花园。",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function GardenPage() {
  const posts = await getGardenContentPosts();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-24 md:px-8">
      <header className="mb-14 border-b border-border pb-10">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
          Hidden garden
        </p>
        <h1 className="mt-4 max-w-4xl text-balance text-5xl font-medium tracking-tight md:text-7xl">
          一些不放在首页里的随笔、图片和私人记录。
        </h1>
      </header>
      <PostList posts={posts} />
      <ContactFooter />
    </main>
  );
}
