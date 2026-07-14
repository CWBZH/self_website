"use client";

import {
  getPostCover,
  getPostPath,
  withLanguagePath,
  type PersonalPost,
  type PersonalPostLanguage,
} from "@/lib/content";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type ImageEntryCardProps = {
  post: PersonalPost;
  size?: "standard" | "wide" | "featured";
  language?: PersonalPostLanguage;
};

const typeLabels: Record<PersonalPost["type"], string> = {
  journal: "Journal",
  note: "Note",
  garden: "Garden",
};

function heightClass(size: ImageEntryCardProps["size"]) {
  if (size === "featured") return "min-h-[68vh]";
  if (size === "wide") return "min-h-[460px] lg:col-span-2";
  return "min-h-[380px]";
}

export function ImageEntryCard({ post, size = "standard", language = "zh" }: ImageEntryCardProps) {
  const href = withLanguagePath(getPostPath(post), language);
  const cover = getPostCover(post);

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-3xl bg-muted ${heightClass(size)}`}
    >
      <Image
        src={cover}
        alt={post.title}
        fill
        sizes={size === "featured" ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
        className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition duration-500 group-hover:from-black/78" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/70">
          <span>{typeLabels[post.type] ?? post.type}</span>
          <span>/</span>
          <span>{post.readingTime ?? "Read"}</span>
        </div>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="max-w-3xl text-balance text-3xl font-medium tracking-tight md:text-5xl">
              {post.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72 opacity-90 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 md:translate-y-2 md:opacity-0">
              {post.summary}
            </p>
          </div>
          <span className="hidden size-16 shrink-0 place-items-center rounded-full border border-white/30 bg-white/10 text-sm backdrop-blur transition duration-500 group-hover:bg-white group-hover:text-black md:grid">
            Open
          </span>
        </div>
      </div>
      <ArrowUpRight className="absolute right-6 top-6 size-5 text-white/70 transition duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
    </Link>
  );
}
