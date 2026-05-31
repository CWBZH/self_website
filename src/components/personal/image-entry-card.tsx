"use client";

import { getPostCover, getPostPath, type PersonalPost } from "@/lib/content";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

type ImageEntryCardProps = {
  post: PersonalPost;
  size?: "large" | "medium" | "small";
  action?: "Read" | "Open" | "Explore";
};

export function ImageEntryCard({
  post,
  size = "medium",
}: ImageEntryCardProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const imageSizes =
    size === "large"
      ? "(min-width: 768px) 100vw, 100vw"
      : size === "medium"
        ? "(min-width: 768px) 66vw, 100vw"
        : "(min-width: 768px) 50vw, 100vw";

  return (
    <Link
      ref={ref}
      href={getPostPath(post)}
      onPointerMove={(event) => {
        const card = ref.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty(
          "--mx",
          `${((event.clientX - rect.left) / rect.width - 0.5).toFixed(3)}`
        );
        card.style.setProperty(
          "--my",
          `${((event.clientY - rect.top) / rect.height - 0.5).toFixed(3)}`
        );
      }}
      onPointerLeave={() => {
        const card = ref.current;
        if (!card) return;
        card.style.setProperty("--mx", "0");
        card.style.setProperty("--my", "0");
      }}
      className={[
        "group relative isolate overflow-hidden rounded-lg bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "min-h-[380px] md:min-h-[460px]",
        size === "large" ? "md:col-span-3 md:min-h-[620px]" : "",
        size === "medium" ? "md:col-span-2" : "",
        size === "small" ? "md:col-span-2 md:min-h-[360px]" : "",
      ].join(" ")}
    >
      <Image
        src={getPostCover(post)}
        alt={post.title}
        fill
        sizes={imageSizes}
        className="object-cover transition duration-700 ease-out motion-reduce:transition-none md:group-hover:scale-[1.055]"
        style={{
          transform:
            "translate3d(calc(var(--mx, 0) * 10px), calc(var(--my, 0) * 10px), 0) scale(1.015)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/22 to-black/5 transition-opacity duration-700 group-hover:opacity-90" />
      <div className="absolute inset-x-5 bottom-5 z-10 text-white transition duration-700 ease-out md:translate-y-3 md:group-hover:translate-y-0 motion-reduce:transition-none">
        <p className="mb-3 text-xs uppercase tracking-[0.12em] text-white/70">
          {post.type === "note"
            ? "Note"
            : post.type === "garden"
              ? "Garden"
              : "Journal"}{" "}
          · {post.readingTime ?? "4 min"} · {post.publishedAt}
        </p>
        <h2 className="max-w-xl text-balance text-3xl font-medium leading-none tracking-tight md:text-5xl">
          {post.title}
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-6 text-white/76 opacity-100 md:translate-y-3 md:opacity-0 md:transition md:duration-700 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          {post.summary}
        </p>
      </div>
    </Link>
  );
}
