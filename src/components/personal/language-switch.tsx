"use client";

import { usePathname, useSearchParams } from "next/navigation";

function languageHref(pathname: string, searchParams: URLSearchParams, language: "zh" | "en") {
  const params = new URLSearchParams(searchParams.toString());

  if (language === "en") params.set("lang", "en");
  else params.delete("lang");

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function LanguageSwitch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeLanguage = searchParams.get("lang") === "en" ? "en" : "zh";

  return (
    <div className="flex items-center rounded-3xl border border-border bg-background p-0.5 text-[11px] font-medium">
      {(["zh", "en"] as const).map((language) => (
        <a
          key={language}
          href={languageHref(pathname, searchParams, language)}
          className={`rounded-2xl px-2.5 py-1 transition ${
            activeLanguage === language
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {language === "zh" ? "中" : "EN"}
        </a>
      ))}
    </div>
  );
}
