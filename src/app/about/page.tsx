import { ContactFooter } from "@/components/personal/contact-footer";
import { resolveLanguage } from "@/lib/content";
import { publicInteractionsEnabled } from "@/lib/public-interactions";
import { getSiteSettings } from "@/lib/server/site-settings";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
};

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function AboutPage({ searchParams }: PageProps) {
  const language = resolveLanguage((await searchParams)?.lang);
  const settings = await getSiteSettings();
  const aboutParagraphs = publicInteractionsEnabled
    ? settings.aboutParagraphs
    : settings.aboutParagraphs.filter(
        (paragraph) => !/room|chat|conversation|visitor|comment|聊天室|留言|评论|访客/i.test(paragraph)
      );

  return (
    <main id="top">
      <section className="grid gap-8 py-8 sm:py-10 md:grid-cols-[0.85fr_1.15fr] md:gap-10 md:py-16">
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
            {settings.aboutEyebrow}
          </p>
          <h1 className="mt-4 text-balance text-5xl font-medium leading-[0.95] tracking-tight sm:mt-5 sm:text-6xl md:text-8xl">
            {settings.aboutTitle}
          </h1>
        </div>
        <div className="self-end space-y-5 text-base leading-7 text-muted-foreground sm:space-y-6 sm:text-lg sm:leading-8">
          {aboutParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {!publicInteractionsEnabled ? (
            <p>
              Public interaction features are currently unavailable.
            </p>
          ) : null}
        </div>
      </section>
      <ContactFooter language={language} />
    </main>
  );
}
