import { ContactFooter } from "@/components/personal/contact-footer";
import { resolveLanguage } from "@/lib/content";
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

  return (
    <main id="top">
      <section className="grid gap-10 py-10 md:grid-cols-[0.85fr_1.15fr] md:py-16">
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
            {settings.aboutEyebrow}
          </p>
          <h1 className="mt-5 text-balance text-6xl font-medium leading-none tracking-tight md:text-8xl">
            {settings.aboutTitle}
          </h1>
        </div>
        <div className="self-end space-y-6 text-lg leading-8 text-muted-foreground">
          {settings.aboutParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
      <ContactFooter language={language} />
    </main>
  );
}
