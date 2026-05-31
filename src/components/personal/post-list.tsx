import { getPostCover, getPostPath, type PersonalPost } from "@/lib/content";
import Image from "next/image";
import Link from "next/link";

type PostListProps = {
  posts: PersonalPost[];
  eyebrow: string;
};

export function PostList({ posts, eyebrow }: PostListProps) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {posts.map((post) => (
        <Link
          key={post._meta.path}
          href={getPostPath(post)}
          className="group grid gap-5 py-6 md:grid-cols-[160px_1fr_auto] md:items-center"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg md:aspect-square">
            <Image
              src={getPostCover(post)}
              alt={post.title}
              fill
              sizes="(min-width: 768px) 160px, 100vw"
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {eyebrow} · {post.publishedAt}
            </p>
            <h2 className="mt-2 text-balance text-3xl font-medium leading-tight tracking-tight md:text-5xl">
              {post.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {post.summary}
            </p>
          </div>
          <div className="text-sm text-muted-foreground md:text-right">
            {post.readingTime ?? "4 min"}
          </div>
        </Link>
      ))}
    </div>
  );
}
