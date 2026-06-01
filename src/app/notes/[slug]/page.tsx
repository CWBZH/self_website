import { ArticleShell } from "@/components/personal/article-shell";
import {
  getAdjacentContentPosts,
  getContentPostByRoute,
} from "@/lib/server/content-service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getContentPostByRoute("note", slug);

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

export default async function NotePostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getContentPostByRoute("note", slug);

  if (!post) notFound();

  const adjacent = await getAdjacentContentPosts("note", slug);

  return <ArticleShell post={post} type="note" {...adjacent} />;
}
