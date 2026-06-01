import { ContactFooter } from "@/components/personal/contact-footer";
import { PostList } from "@/components/personal/post-list";
import { getContentPostsByType } from "@/lib/server/content-service";
import { getSiteSettings } from "@/lib/server/site-settings";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Journal" };

export default async function JournalPage() {
  const [posts, settings] = await Promise.all([getContentPostsByType("journal"), getSiteSettings()]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-24 md:px-8">
      <header className="mb-14 border-b border-border pb-10">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{settings.journalEyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-balance text-5xl font-medium tracking-tight md:text-7xl">{settings.journalTitle}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{settings.journalDescription}</p>
      </header>
      <PostList posts={posts} emptyText={settings.journalEmptyText} />
      <ContactFooter />
    </main>
  );
}
