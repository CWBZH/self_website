import { ChatRoom } from "@/components/personal/chat-room";
import { ContactFooter } from "@/components/personal/contact-footer";
import { resolveLanguage } from "@/lib/content";
import {
  interactionsDisabledMessage,
  interactionsDisabledTitle,
  publicInteractionsEnabled,
} from "@/lib/public-interactions";
import { getSiteSettings } from "@/lib/server/site-settings";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Room",
};

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function RoomPage({ searchParams }: PageProps) {
  const language = resolveLanguage((await searchParams)?.lang);
  const settings = await getSiteSettings();

  return (
    <main id="top">
      <section className="py-8 sm:py-10 md:py-16">
        <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
          {settings.roomEyebrow}
        </p>
        <h1 className="mt-4 max-w-5xl text-balance text-5xl font-medium leading-[0.95] tracking-tight sm:mt-5 sm:text-6xl md:text-8xl">
          {settings.roomTitle}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-7 sm:text-lg sm:leading-8">
          {publicInteractionsEnabled ? settings.roomDescription : interactionsDisabledMessage}
        </p>
      </section>
      {publicInteractionsEnabled ? (
        <ChatRoom />
      ) : (
        <section className="rounded-2xl border border-border bg-muted/30 p-5 sm:rounded-3xl sm:p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Room
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight">
            {interactionsDisabledTitle}
          </h2>
          <p className="mt-4 max-w-2xl leading-8 text-muted-foreground">
            {interactionsDisabledMessage}
          </p>
        </section>
      )}
      <ContactFooter language={language} />
    </main>
  );
}
