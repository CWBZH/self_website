import { getPostPath, getPostSlug } from "@/lib/content";
import { allPosts } from "content-collections";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export async function generateStaticParams() {
  return allPosts
    .filter((post) => post.visibility !== "garden")
    .map((post) => ({
      slug: getPostSlug(post),
    }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function BlogCompatDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = allPosts.find((item) => getPostSlug(item) === slug);

  if (!post) {
    notFound();
  }

  redirect(getPostPath(post));
}
