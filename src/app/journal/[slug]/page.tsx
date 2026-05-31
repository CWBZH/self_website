import { ArticleShell } from "@/components/personal/article-shell";
import {
  getPostByRoute,
  getPostCover,
  getPostSlug,
  getPostsByType,
} from "@/lib/content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getPostsByType("journal").map((post) => ({
    slug: getPostSlug(post),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostByRoute("journal", slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      images: [getPostCover(post)],
      type: "article",
    },
  };
}

export default async function JournalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostByRoute("journal", slug);

  if (!post) {
    notFound();
  }

  return <ArticleShell post={post} type="journal" />;
}
