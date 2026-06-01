import { ContactFooter } from "@/components/personal/contact-footer";
import { ImageEntryCard } from "@/components/personal/image-entry-card";
import { getPublicContentPosts } from "@/lib/server/content-service";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  const posts = await getPublicContentPosts();
  const featured = posts[0];
  const gridPosts = posts.slice(1, 7);

  return (
    <main id="top" className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <section className="flex min-h-[58vh] flex-col justify-end border-b border-border pb-10 pt-24">
        <p className="mb-4 text-sm uppercase tracking-[0.18em] text-muted-foreground">
          Personal room / Journal / Notes
        </p>
        <h1 className="max-w-5xl text-balance text-6xl font-medium leading-none tracking-tight md:text-8xl">
          一个安静的个人数字客厅，用来写文章、放图片，也留一张椅子给访客聊天。
        </h1>
        <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <Link className="rounded-full border border-border px-4 py-2 transition hover:bg-foreground hover:text-background" href="/journal">
            Journal
          </Link>
          <Link className="rounded-full border border-border px-4 py-2 transition hover:bg-foreground hover:text-background" href="/notes">
            Notes
          </Link>
          <Link className="rounded-full border border-border px-4 py-2 transition hover:bg-foreground hover:text-background" href="/room">
            Room
          </Link>
        </div>
      </section>

      {featured ? (
        <section className="py-10">
          <ImageEntryCard post={featured} size="featured" />
        </section>
      ) : null}

      <section className="grid gap-6 py-6 md:grid-cols-2 lg:grid-cols-3">
        {gridPosts.map((post, index) => (
          <ImageEntryCard
            key={post.id}
            post={post}
            size={index % 3 === 0 ? "wide" : "standard"}
          />
        ))}
      </section>

      <ContactFooter />
    </main>
  );
}
