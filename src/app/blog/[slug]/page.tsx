import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogCompatDetailPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/journal/${slug}`);
}
