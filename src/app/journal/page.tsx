import { ContactFooter } from "@/components/personal/contact-footer";
import { PostList } from "@/components/personal/post-list";
import { localizePost, resolveLanguage } from "@/lib/content";
import { getContentPostsByType } from "@/lib/server/content-service";
import { getSiteSettings } from "@/lib/server/site-settings";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Journal" };

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function JournalPage({ searchParams }: PageProps) {
  const language = resolveLanguage((await searchParams)?.lang);
  const [posts, settings] = await Promise.all([getContentPostsByType("journal"), getSiteSettings()]);
  const localizedPosts = posts.map((post) => localizePost(post, language));

  return (
    <main className="mx-auto w-full max-w-6xl py-14 sm:py-20 md:py-24">
      <header className="mb-9 border-b border-border pb-8 sm:mb-14 sm:pb-10">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{settings.journalEyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-balance text-4xl font-medium leading-[1.02] tracking-tight sm:text-5xl md:text-7xl">{settings.journalTitle}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-5 sm:text-lg sm:leading-8">{settings.journalDescription}</p>
      </header>
      <PostList posts={localizedPosts} emptyText={settings.journalEmptyText} language={language} />
      <ContactFooter language={language} />
    </main>
  );
}
