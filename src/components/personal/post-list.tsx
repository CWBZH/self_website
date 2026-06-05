import {
  getPostCover,
  getPostPath,
  withLanguagePath,
  type PersonalPost,
  type PersonalPostLanguage,
} from "@/lib/content";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type PostListProps = {
  posts: PersonalPost[];
  emptyText?: string;
  language?: PersonalPostLanguage;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function PostList({ posts, emptyText = "No published content yet.", language = "zh" }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <section className="grid gap-4">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={withLanguagePath(getPostPath(post), language)}
          className="group grid gap-5 rounded-3xl border border-border p-4 transition hover:bg-muted/50 md:grid-cols-[220px_1fr_auto] md:items-center"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
            <Image src={getPostCover(post)} alt={post.title} fill sizes="220px" className="object-cover transition duration-500 group-hover:scale-[1.04]" />
          </div>
          <div>
            <div className="mb-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <span>{post.type}</span>
              <span>/</span>
              <span>{formatDate(post.publishedAt)}</span>
              {post.readingTime ? <span>/ {post.readingTime}</span> : null}
            </div>
            <h2 className="text-2xl font-medium tracking-tight md:text-3xl">{post.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{post.summary}</p>
          </div>
          <ArrowUpRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-foreground" />
        </Link>
      ))}
    </section>
  );
}
