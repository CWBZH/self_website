import { ContactFooter } from "@/components/personal/contact-footer";
import { PostList } from "@/components/personal/post-list";
import { getGardenPosts } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Garden",
  description: "半隐藏的随笔、图片和未完成想法。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GardenPage() {
  const posts = getGardenPosts();

  return (
    <main id="top">
      <section className="py-10 md:py-16">
        <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
          Hidden Garden
        </p>
        <h1 className="mt-5 max-w-5xl text-balance text-6xl font-medium leading-none tracking-tight md:text-8xl">
          一些不放在正门的文字和图片。
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
          这是半隐藏区：不进导航、不进 sitemap、noindex，但知道地址的人仍然可以访问。
        </p>
      </section>
      <PostList posts={posts} eyebrow="Garden" />
      <ContactFooter />
    </main>
  );
}
