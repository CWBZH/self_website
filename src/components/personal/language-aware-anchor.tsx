"use client";

import { useSearchParams } from "next/navigation";
import { forwardRef } from "react";
import type { AnchorHTMLAttributes } from "react";

type LanguageAwareAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

function withCurrentLanguage(href: string, lang: string | null) {
  if (lang !== "en" || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) {
    return href;
  }

  const [path, hash = ""] = href.split("#");
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}lang=en${hash ? `#${hash}` : ""}`;
}

export const LanguageAwareAnchor = forwardRef<HTMLAnchorElement, LanguageAwareAnchorProps>(
  function LanguageAwareAnchor({ href, ...props }, ref) {
  const searchParams = useSearchParams();
  return <a ref={ref} href={withCurrentLanguage(href, searchParams.get("lang"))} {...props} />;
  }
);
