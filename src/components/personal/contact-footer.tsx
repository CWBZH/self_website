import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getSiteSettings } from "@/lib/server/site-settings";

export async function ContactFooter() {
  const settings = await getSiteSettings();
  const links = [
    settings.email ? ["Email", `mailto:${settings.email}`] : null,
    ["Room", "/room"],
    settings.githubUrl ? ["GitHub", settings.githubUrl] : null,
    settings.socialUrl ? ["Social", settings.socialUrl] : null,
    ["Back top", "#top"],
  ].filter(Boolean) as Array<[string, string]>;

  return (
    <footer id="contact" className="mt-24 rounded-lg bg-foreground px-6 py-12 text-background md:px-10 md:py-16">
      <p className="mb-5 text-sm uppercase tracking-[0.12em] text-background/60">
        {settings.footerEyebrow}
      </p>
      <h2 className="max-w-5xl text-balance text-5xl font-medium leading-none tracking-tight md:text-8xl">
        {settings.footerTitle}
      </h2>
      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-background/20 pt-6">
        {links.map(([label, href]) => {
          const isExternal = href.startsWith("http");
          return (
            <Link key={label} href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined} className="group inline-flex items-center gap-2 rounded-full border border-background/25 px-4 py-2 text-sm transition hover:bg-background hover:text-foreground">
              {label}
              <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          );
        })}
        {settings.showGardenDot ? (
          <Link href="/garden" aria-label="Open hidden garden" className="ml-auto grid size-8 place-items-center rounded-full text-3xl leading-none text-background/45 transition hover:bg-background hover:text-foreground">
            .
          </Link>
        ) : null}
      </div>
    </footer>
  );
}
