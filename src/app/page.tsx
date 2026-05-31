import { ContactFooter } from "@/components/personal/contact-footer";
import { ImageEntryCard } from "@/components/personal/image-entry-card";
import { getPublicPosts } from "@/lib/content";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const posts = getPublicPosts();
  const featured = posts[0];
  const gridPosts = posts.slice(1, 6);

  return (
    <main id="top" className="min-h-dvh">
      <section className="grid min-h-[82vh] items-end gap-10 py-10 md:grid-cols-[0.9fr_1.1fr] md:py-16">
        <div className="pb-4 md:pb-20">
          <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
            Personal Digital Room
          </p>
          <h1 className="mt-5 max-w-5xl text-balance text-6xl font-medium leading-[0.9] tracking-tight md:text-8xl lg:text-[9rem]">
            Notes, images, and quiet conversations.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
            一个以图片作为入口的个人空间。长文、短随笔、生活记录和一个开放的聊天室，共用同一种安静的阅读节奏。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm text-background transition hover:opacity-85"
            >
              Enter Journal
              <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/room"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm transition hover:bg-accent"
            >
              Open Room
            </Link>
          </div>
        </div>

        {featured ? (
          <ImageEntryCard post={featured} size="large" action="Read" />
        ) : null}
      </section>

      <section className="border-t border-border py-16">
        <div className="mb-10 grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
          <h2 className="text-5xl font-medium leading-none tracking-tight md:text-7xl">
            Image-led entries
          </h2>
          <p className="max-w-2xl self-end text-lg leading-8 text-muted-foreground">
            首页让图片先说话，再让标题、摘要和标签渐进出现。桌面端保留细腻 hover，移动端保持直接、轻量和可读。
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-6">
          {gridPosts.map((post, index) => (
            <ImageEntryCard
              key={post._meta.path}
              post={post}
              size={index < 2 ? "large" : "medium"}
              action={index % 2 === 0 ? "Explore" : "Open"}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-8 border-t border-border py-16 md:grid-cols-[1fr_0.75fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
            Room
          </p>
          <h2 className="mt-4 max-w-3xl text-balance text-5xl font-medium leading-none tracking-tight md:text-7xl">
            聊天室像访客休息区，不像复杂社交平台。
          </h2>
        </div>
        <div className="self-end rounded-lg border border-border bg-card p-5">
          <p className="text-sm leading-7 text-muted-foreground">
            第一阶段先做半交互 UI：昵称、消息流、在线人数和发送框。下一阶段再接 WebSocket、PostgreSQL 和后台删除。
          </p>
          <Link
            href="/room"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background"
          >
            Go to Room
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      <ContactFooter />
    </main>
  );
}
