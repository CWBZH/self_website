import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getSiteSettings } from "@/lib/server/site-settings";
import { withLanguagePath, type PersonalPostLanguage } from "@/lib/content";
import { publicInteractionsEnabled } from "@/lib/public-interactions";

const icpFallbackNumber = "粤ICP备2026074388号-1";
const icpFallbackUrl = "https://beian.miit.gov.cn";
const policeBeianNumber = "粤公网安备44011102485000号";
const policeBeianUrl =
  "https://beian.mps.gov.cn/#/query/webSearch?code=44011102485000";

export async function ContactFooter({ language = "zh" }: { language?: PersonalPostLanguage }) {
  const settings = await getSiteSettings();
  const icpNumber = settings.icpNumber || icpFallbackNumber;
  const icpUrl = settings.icpUrl || icpFallbackUrl;
  const links = [
    settings.email ? ["邮箱", `mailto:${settings.email}`] : null,
    publicInteractionsEnabled ? ["聊天室", "/room"] : null,
    settings.githubUrl ? ["GitHub", settings.githubUrl] : null,
    settings.socialUrl ? ["Social", settings.socialUrl] : null,
    ["返回顶部", "#top"],
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
            <Link key={label} href={withLanguagePath(href, language)} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined} className="group inline-flex items-center gap-2 rounded-full border border-background/25 px-4 py-2 text-sm transition hover:bg-background hover:text-foreground">
              {label}
              <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          );
        })}
        {settings.showGardenDot ? (
          <Link href={withLanguagePath("/garden", language)} aria-label="Open hidden garden" className="ml-auto grid size-8 place-items-center rounded-full text-3xl leading-none text-background/45 transition hover:bg-background hover:text-foreground">
            .
          </Link>
        ) : null}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-background/10 pt-5 text-xs text-background/50">
        {icpNumber ? (
          <Link href={icpUrl} target="_blank" rel="noreferrer" className="transition hover:text-background">
            {icpNumber}
          </Link>
        ) : null}
        <Link
          href={policeBeianUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 transition hover:text-background"
        >
          <Image src="/beian.png" alt="" width={20} height={20} className="h-4 w-4" />
          <span>{policeBeianNumber}</span>
        </Link>
      </div>
    </footer>
  );
}
