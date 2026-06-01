import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SiteSettings = {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  locale: string;
  showStaticMdxContent: boolean;
  homeEyebrow: string;
  homeTitle: string;
  journalEyebrow: string;
  journalTitle: string;
  journalDescription: string;
  notesEyebrow: string;
  notesTitle: string;
  notesDescription: string;
  gardenEyebrow: string;
  gardenTitle: string;
  gardenDescription: string;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutParagraphs: string[];
  roomEyebrow: string;
  roomTitle: string;
  roomDescription: string;
  footerEyebrow: string;
  footerTitle: string;
  email: string;
  githubUrl: string;
  socialUrl: string;
  showGardenDot: boolean;
};

export const defaultSiteSettings: SiteSettings = {
  siteName: "Mr. Bin 的个人数字客厅",
  siteDescription: "一个放置长文、短随笔、图片记录和访客聊天室的个人数字空间。",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://106.52.232.205:3001",
  locale: "zh_CN",
  showStaticMdxContent: false,
  homeEyebrow: "Personal room / Journal / Notes",
  homeTitle: "一个安静的个人数字客厅，用来写文章、放图片，也留一张椅子给访客聊天。",
  journalEyebrow: "Journal",
  journalTitle: "长文章和完整思考。",
  journalDescription: "正式文章、技术记录、项目复盘和完整随笔。",
  notesEyebrow: "Notes",
  notesTitle: "更短、更轻、更接近日常的记录。",
  notesDescription: "短随笔、灵感、摘录和还没完全成形的想法。",
  gardenEyebrow: "Hidden garden",
  gardenTitle: "一些不放在首页里的随笔、图片和私人记录。",
  gardenDescription: "半隐藏的随笔花园。",
  aboutEyebrow: "About",
  aboutTitle: "不是简历，不是作品集，是个人数字客厅。",
  aboutParagraphs: [
    "一个放置长文、短随笔、图片记录和访客聊天室的个人数字客厅。",
    "Journal 放正式文章，Notes 放短想法，Room 留给访客聊天，Garden 藏在页脚那个小句号后面。",
    "这里会慢慢变成一个更私人、更可维护的内容空间。",
  ],
  roomEyebrow: "Room",
  roomTitle: "一个能停下来聊一句的房间。",
  roomDescription: "这里是访客聊天室。留下昵称，写一句话，不需要复杂社交关系。",
  footerEyebrow: "Contact",
  footerTitle: "Leave a note, enter the room, or send an email.",
  email: "hello@example.com",
  githubUrl: "https://github.com/CWBZH",
  socialUrl: "",
  showGardenDot: true,
};

const dataDir = path.join(process.cwd(), "data");
const settingsPath = path.join(dataDir, "site-settings.json");

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function normalizeParagraphs(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 8);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  return defaultSiteSettings.aboutParagraphs;
}

export function normalizeSiteSettings(input: Partial<SiteSettings> = {}): SiteSettings {
  return {
    siteName: normalizeString(input.siteName, defaultSiteSettings.siteName),
    siteDescription: normalizeString(input.siteDescription, defaultSiteSettings.siteDescription),
    siteUrl: normalizeString(input.siteUrl, defaultSiteSettings.siteUrl),
    locale: normalizeString(input.locale, defaultSiteSettings.locale),
    showStaticMdxContent: Boolean(input.showStaticMdxContent),
    homeEyebrow: normalizeString(input.homeEyebrow, defaultSiteSettings.homeEyebrow),
    homeTitle: normalizeString(input.homeTitle, defaultSiteSettings.homeTitle),
    journalEyebrow: normalizeString(input.journalEyebrow, defaultSiteSettings.journalEyebrow),
    journalTitle: normalizeString(input.journalTitle, defaultSiteSettings.journalTitle),
    journalDescription: normalizeString(input.journalDescription, defaultSiteSettings.journalDescription),
    notesEyebrow: normalizeString(input.notesEyebrow, defaultSiteSettings.notesEyebrow),
    notesTitle: normalizeString(input.notesTitle, defaultSiteSettings.notesTitle),
    notesDescription: normalizeString(input.notesDescription, defaultSiteSettings.notesDescription),
    gardenEyebrow: normalizeString(input.gardenEyebrow, defaultSiteSettings.gardenEyebrow),
    gardenTitle: normalizeString(input.gardenTitle, defaultSiteSettings.gardenTitle),
    gardenDescription: normalizeString(input.gardenDescription, defaultSiteSettings.gardenDescription),
    aboutEyebrow: normalizeString(input.aboutEyebrow, defaultSiteSettings.aboutEyebrow),
    aboutTitle: normalizeString(input.aboutTitle, defaultSiteSettings.aboutTitle),
    aboutParagraphs: normalizeParagraphs(input.aboutParagraphs),
    roomEyebrow: normalizeString(input.roomEyebrow, defaultSiteSettings.roomEyebrow),
    roomTitle: normalizeString(input.roomTitle, defaultSiteSettings.roomTitle),
    roomDescription: normalizeString(input.roomDescription, defaultSiteSettings.roomDescription),
    footerEyebrow: normalizeString(input.footerEyebrow, defaultSiteSettings.footerEyebrow),
    footerTitle: normalizeString(input.footerTitle, defaultSiteSettings.footerTitle),
    email: normalizeString(input.email, defaultSiteSettings.email),
    githubUrl: normalizeString(input.githubUrl, defaultSiteSettings.githubUrl),
    socialUrl: normalizeString(input.socialUrl, defaultSiteSettings.socialUrl),
    showGardenDot: input.showGardenDot ?? defaultSiteSettings.showGardenDot,
  };
}

export async function getSiteSettings() {
  await mkdir(dataDir, { recursive: true });

  try {
    const raw = await readFile(settingsPath, "utf8");
    return normalizeSiteSettings(JSON.parse(raw) as Partial<SiteSettings>);
  } catch {
    return defaultSiteSettings;
  }
}

export async function updateSiteSettings(input: Partial<SiteSettings>) {
  await mkdir(dataDir, { recursive: true });
  const current = await getSiteSettings();
  const next = normalizeSiteSettings({ ...current, ...input });
  await writeFile(settingsPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}
