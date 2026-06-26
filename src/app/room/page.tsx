import { ChatRoom } from "@/components/personal/chat-room";
import { ContactFooter } from "@/components/personal/contact-footer";
import { resolveLanguage } from "@/lib/content";
import {
  interactionsDisabledMessage,
  publicInteractionsEnabled,
} from "@/lib/public-interactions";
import { getSiteSettings } from "@/lib/server/site-settings";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "交互功能暂未开放",
};

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function RoomPage({ searchParams }: PageProps) {
  const language = resolveLanguage((await searchParams)?.lang);
  const settings = await getSiteSettings();

  return (
    <main id="top">
      <section className="py-10 md:py-16">
        <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
          {settings.roomEyebrow}
        </p>
        <h1 className="mt-5 max-w-5xl text-balance text-6xl font-medium leading-none tracking-tight md:text-8xl">
          {settings.roomTitle}
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
          {publicInteractionsEnabled ? settings.roomDescription : interactionsDisabledMessage}
        </p>
      </section>
      {publicInteractionsEnabled ? (
        <ChatRoom />
      ) : (
        <section className="rounded-3xl border border-border bg-muted/30 p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
            备案审核模式
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight">
            交互功能暂未开放
          </h2>
          <p className="mt-4 max-w-2xl leading-8 text-muted-foreground">
            本网站当前作为个人非经营性博客进行公安联网备案审核。评论、访客留言和聊天室功能暂不开放。
          </p>
        </section>
      )}
      <ContactFooter language={language} />
    </main>
  );
}
