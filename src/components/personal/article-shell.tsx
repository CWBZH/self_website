import { CommentBox } from "@/components/personal/comment-box";
import { ContactFooter } from "@/components/personal/contact-footer";
import {
  getPostCollectionPath,
  getPostCover,
  getPostPath,
  localizePost,
  withLanguagePath,
  type PersonalPost,
  type PersonalPostLanguage,
} from "@/lib/content";
import { publicInteractionsEnabled } from "@/lib/public-interactions";
import { mdxComponents } from "@/mdx-components";
import { MDXContent } from "@content-collections/mdx/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ArticleShellProps = {
  post: PersonalPost;
  type: "journal" | "note" | "garden";
  language?: PersonalPostLanguage;
  previousPost?: PersonalPost | null;
  nextPost?: PersonalPost | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

const collectionLabels: Record<ArticleShellProps["type"], string> = {
  journal: "journal",
  note: "notes",
  garden: "garden",
};

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        img: ({ src, alt }) => {
          if (!src) return null;
          return (
            <span className="relative my-8 block aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-muted">
              <Image
                src={String(src)}
                alt={alt ?? ""}
                fill
                sizes="(max-width: 768px) 100vw, 820px"
                className="object-cover"
              />
            </span>
          );
        },
        a: ({ href, children }) => (
          <a
            href={href}
            className="underline decoration-foreground/30 underline-offset-4 transition hover:decoration-foreground"
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={href?.startsWith("http") ? "noreferrer" : undefined}
          >
            {children}
          </a>
        ),
        code: ({ children, className }) => (
          <code className={className ?? "rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm"}>
            {children}
          </code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function ArticleShell({
  post,
  type,
  language = "zh",
  previousPost,
  nextPost,
}: ArticleShellProps) {
  const localizedPost = localizePost(post, language);
  const localizedPreviousPost = previousPost ? localizePost(previousPost, language) : null;
  const localizedNextPost = nextPost ? localizePost(nextPost, language) : null;
  const cover = getPostCover(localizedPost);

  return (
    <main className="mx-auto w-full max-w-6xl py-5 sm:py-8" id="top">
      <Link
        href={withLanguagePath(getPostCollectionPath(type), language)}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground sm:mb-8"
      >
        <ArrowLeft className="size-4" />
        Back to {collectionLabels[type]}
      </Link>

      <article>
        <header className="grid gap-6 border-b border-border pb-8 sm:gap-8 sm:pb-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
              {localizedPost.type} / {formatDate(localizedPost.publishedAt)}
            </p>
            <h1 className="mt-4 text-balance text-4xl font-medium leading-[0.98] tracking-tight sm:mt-5 sm:text-5xl md:text-7xl">
              {localizedPost.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
              {localizedPost.summary}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {localizedPost.readingTime ? <span>{localizedPost.readingTime}</span> : null}
              {localizedPost.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-border px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
            <Image
              src={cover}
              alt={localizedPost.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </header>

        <section className="prose prose-neutral mx-auto mt-8 max-w-3xl break-words dark:prose-invert prose-headings:font-medium prose-p:leading-7 prose-img:rounded-xl sm:mt-12 sm:prose-p:leading-8 sm:prose-img:rounded-2xl">
          {localizedPost.source === "mdx" && localizedPost.mdx ? (
            <MDXContent code={localizedPost.mdx} components={mdxComponents} />
          ) : (
            <MarkdownContent content={localizedPost.content ?? ""} />
          )}
        </section>
      </article>

      <nav className="mx-auto mt-12 grid max-w-3xl gap-3 border-y border-border py-5 sm:mt-16 sm:py-6 md:grid-cols-2">
        {localizedPreviousPost ? (
          <Link
            href={withLanguagePath(getPostPath(localizedPreviousPost), language)}
            className="group rounded-2xl border border-border p-4 transition hover:bg-muted sm:p-5"
          >
            <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Previous
            </span>
            <span className="mt-2 flex items-center gap-2 text-lg font-medium">
              <ArrowLeft className="size-4 transition group-hover:-translate-x-1" />
              {localizedPreviousPost.title}
            </span>
          </Link>
        ) : null}
        {localizedNextPost ? (
          <Link
            href={withLanguagePath(getPostPath(localizedNextPost), language)}
            className="group rounded-2xl border border-border p-4 transition hover:bg-muted sm:p-5 md:text-right"
          >
            <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Next
            </span>
            <span className="mt-2 flex items-center gap-2 text-lg font-medium md:justify-end">
              {localizedNextPost.title}
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        ) : null}
      </nav>

      {publicInteractionsEnabled ? (
        <div className="mx-auto max-w-3xl">
          <CommentBox postType={localizedPost.type} postSlug={localizedPost.slug} />
        </div>
      ) : null}

      <ContactFooter language={language} />
    </main>
  );
}
