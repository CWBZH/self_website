import { ArticleShell } from "@/components/personal/article-shell";
import { resolveLanguage } from "@/lib/content";
import {
  getAdjacentContentPosts,
  getContentPostByRoute,
} from "@/lib/server/content-service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getContentPostByRoute("journal", slug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      images: post.cover ?? post.image ? [post.cover ?? post.image ?? ""] : [],
    },
  };
}

export default async function JournalPostPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const language = resolveLanguage((await searchParams)?.lang);
  const post = await getContentPostByRoute("journal", slug);

  if (!post) notFound();

  const adjacent = await getAdjacentContentPosts("journal", slug);

  return <ArticleShell post={post} type="journal" language={language} {...adjacent} />;
}
