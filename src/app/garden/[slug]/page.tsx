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
  const post = await getContentPostByRoute("garden", slug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.summary,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function GardenPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getContentPostByRoute("garden", slug);

  if (!post) notFound();

  const adjacent = await getAdjacentContentPosts("garden", slug);

  return <ArticleShell post={post} type="garden" {...adjacent} />;
}
