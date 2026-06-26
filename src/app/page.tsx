import { ContactFooter } from "@/components/personal/contact-footer";
import { ImageEntryCard } from "@/components/personal/image-entry-card";
import {
  localizePost,
  resolveLanguage,
  withLanguagePath,
} from "@/lib/content";
import { publicInteractionsEnabled } from "@/lib/public-interactions";
import { getSiteSettings } from "@/lib/server/site-settings";
import { getPublicContentPosts } from "@/lib/server/content-service";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const language = resolveLanguage((await searchParams)?.lang);
  const [posts, settings] = await Promise.all([getPublicContentPosts(), getSiteSettings()]);
  const localizedPosts = posts.map((post) => localizePost(post, language));
  const featured = localizedPosts[0];
  const gridPosts = localizedPosts.slice(1, 7);

  return (
    <main id="top" className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <section className="flex min-h-[58vh] flex-col justify-end border-b border-border pb-10 pt-24">
        <p className="mb-4 text-sm uppercase tracking-[0.18em] text-muted-foreground">
          {settings.homeEyebrow}
        </p>
        <h1 className="max-w-5xl text-balance text-6xl font-medium leading-none tracking-tight md:text-8xl">
          {settings.homeTitle}
        </h1>
        <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <Link className="rounded-full border border-border px-4 py-2 transition hover:bg-foreground hover:text-background" href={withLanguagePath("/journal", language)}>文章</Link>
          <Link className="rounded-full border border-border px-4 py-2 transition hover:bg-foreground hover:text-background" href={withLanguagePath("/notes", language)}>随笔</Link>
          {publicInteractionsEnabled ? (
            <Link className="rounded-full border border-border px-4 py-2 transition hover:bg-foreground hover:text-background" href={withLanguagePath("/room", language)}>聊天室</Link>
          ) : null}
        </div>
      </section>

      {featured ? <section className="py-10"><ImageEntryCard post={featured} size="featured" language={language} /></section> : null}

      <section className="grid gap-6 py-6 md:grid-cols-2 lg:grid-cols-3">
        {gridPosts.map((post, index) => (
          <ImageEntryCard key={post.id} post={post} size={index % 3 === 0 ? "wide" : "standard"} language={language} />
        ))}
      </section>

      <ContactFooter language={language} />
    </main>
  );
}
