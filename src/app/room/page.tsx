import { ChatRoom } from "@/components/personal/chat-room";
import { ContactFooter } from "@/components/personal/contact-footer";
import { getSiteSettings } from "@/lib/server/site-settings";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Room",
};

export default async function RoomPage() {
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
          {settings.roomDescription}
        </p>
      </section>
      <ChatRoom />
      <ContactFooter />
    </main>
  );
}
