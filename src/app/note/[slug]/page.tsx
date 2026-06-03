import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function NoteCompatDetailPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/notes/${slug}`);
}
