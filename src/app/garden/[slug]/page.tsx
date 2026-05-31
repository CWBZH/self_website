import { ArticleShell } from "@/components/personal/article-shell";
import {
  getGardenPosts,
  getPostByRoute,
  getPostCover,
  getPostSlug,
} from "@/lib/content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getGardenPosts().map((post) => ({
    slug: getPostSlug(post),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostByRoute("garden", slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.summary,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: post.title,
      description: post.summary,
      images: [getPostCover(post)],
      type: "article",
    },
  };
}

export default async function GardenDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostByRoute("garden", slug);

  if (!post) {
    notFound();
  }

  return <ArticleShell post={post} type="garden" />;
}
