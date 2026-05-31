import { CommentBox } from "@/components/personal/comment-box";
import { ContactFooter } from "@/components/personal/contact-footer";
import {
  getAdjacentPosts,
  getPostCover,
  getPostSlug,
  type PersonalPost,
} from "@/lib/content";
import { mdxComponents } from "@/mdx-components";
import { MDXContent } from "@content-collections/mdx/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type ArticleShellProps = {
  post: PersonalPost;
  type: "journal" | "note" | "garden";
};

export function ArticleShell({ post, type }: ArticleShellProps) {
  const slug = getPostSlug(post);
  const { previousPost, nextPost } = getAdjacentPosts(type, slug);
  const backHref =
    type === "note" ? "/notes" : type === "garden" ? "/garden" : "/journal";
  const label = type === "note" ? "Note" : type === "garden" ? "Garden" : "Journal";

  return (
    <main id="top">
      <Link
        href={backHref}
        className="mb-8 inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to {label}
      </Link>

      <article className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
            {label} · {post.publishedAt} · {post.readingTime ?? "4 min"}
          </p>
          <h1 className="mt-4 text-balance text-5xl font-medium leading-none tracking-tight md:text-8xl">
            {post.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            {post.summary}
          </p>
          {post.tags.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <Image
          src={getPostCover(post)}
          alt={post.title}
          width={1600}
          height={900}
          priority
          className="mb-10 aspect-[16/9] w-full rounded-lg object-cover"
        />

        <div className="prose max-w-none text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert prose-p:text-base prose-p:leading-8">
          <MDXContent code={post.mdx} components={mdxComponents} />
        </div>
      </article>

      <nav className="mx-auto mt-14 grid max-w-4xl gap-4 border-t border-border pt-8 md:grid-cols-2">
        {previousPost ? (
          <Link
            href={`${backHref}/${getPostSlug(previousPost)}`}
            className="rounded-lg border border-border p-4 transition hover:bg-accent/50"
          >
            <span className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronLeft className="size-3" />
              Previous
            </span>
            <span className="font-medium">{previousPost.title}</span>
          </Link>
        ) : (
          <div />
        )}
        {nextPost ? (
          <Link
            href={`${backHref}/${getPostSlug(nextPost)}`}
            className="rounded-lg border border-border p-4 text-right transition hover:bg-accent/50"
          >
            <span className="mb-2 flex items-center justify-end gap-1 text-xs text-muted-foreground">
              Next
              <ChevronRight className="size-3" />
            </span>
            <span className="font-medium">{nextPost.title}</span>
          </Link>
        ) : (
          <div />
        )}
      </nav>

      <div className="mx-auto max-w-4xl">
        <CommentBox postType={type} postSlug={slug} />
      </div>
      <ContactFooter />
    </main>
  );
}
