import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function NoteCompatPage({ searchParams }: PageProps) {
  const lang = (await searchParams)?.lang;
  redirect(lang === "en" ? "/notes?lang=en" : "/notes");
}
