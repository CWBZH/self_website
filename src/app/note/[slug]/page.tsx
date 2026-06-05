import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export default async function NoteCompatDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const lang = (await searchParams)?.lang;
  redirect(lang === "en" ? `/notes/${slug}?lang=en` : `/notes/${slug}`);
}
