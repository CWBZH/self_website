import { ChatRoom } from "@/components/personal/chat-room";
import { ContactFooter } from "@/components/personal/contact-footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Room",
  description: "一个轻量的访客聊天室。",
};

export default function RoomPage() {
  return (
    <main id="top">
      <section className="py-10 md:py-16">
        <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
          Room
        </p>
        <h1 className="mt-5 max-w-5xl text-balance text-6xl font-medium leading-none tracking-tight md:text-8xl">
          一个能停下来聊一句的房间。
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
          第一阶段是本地半交互模板。下一阶段会接 PostgreSQL、WebSocket、在线成员和站长删除。
        </p>
      </section>
      <ChatRoom />
      <ContactFooter />
    </main>
  );
}
