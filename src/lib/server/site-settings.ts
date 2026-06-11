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
  journalEmptyText: string;
  notesEmptyText: string;
  gardenEmptyText: string;
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
  icpNumber: string;
  icpUrl: string;
  showGardenDot: boolean;
};

export const defaultSiteSettings: SiteSettings = {
  siteName: "MOL'S ROOM",
  siteDescription: "Words, images and conversations in one personal space.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://106.52.232.205:3001",
  locale: "zh_CN",
  showStaticMdxContent: false,
  homeEyebrow: "Personal room / Journal / Notes",
  homeTitle: "Words, images and conversations in one personal space.",
  journalEyebrow: "Journal",
  journalTitle: "Longer thoughts, written with care.",
  journalDescription: "Essays, longer reflections and finished thoughts.",
  notesEyebrow: "Notes",
  notesTitle: "Small thoughts, loosely collected.",
  notesDescription: "Fragments, brief notes and everyday observations.",
  gardenEyebrow: "Hidden garden",
  gardenTitle: "An evolving garden of images and unfinished thoughts.",
  gardenDescription: "Hidden notes, images and private fragments.",
  journalEmptyText: "No journal posts yet.",
  notesEmptyText: "No notes yet.",
  gardenEmptyText: "No garden entries yet.",
  aboutEyebrow: "About",
  aboutTitle: "A living archive of thoughts, images and conversations.",
  aboutParagraphs: [
    "This is a personal digital space for essays, brief notes, visual records and conversations.",
    "Journal is where longer pieces live. Notes collects smaller thoughts and everyday fragments.",
    "Room is an open space for visitors to leave a message or start a conversation.",
  ],
  roomEyebrow: "Room",
  roomTitle: "A quiet room for visitors and conversations.",
  roomDescription: "No profiles to build. No complicated social graph. Just a room for conversation.",
  footerEyebrow: "Contact",
  footerTitle: "Let's keep in touch.",
  email: "hello@example.com",
  githubUrl: "https://github.com/CWBZH",
  socialUrl: "",
  icpNumber: "粤ICP备2026074388号-1",
  icpUrl: "https://beian.miit.gov.cn",
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
    journalEmptyText: normalizeString(input.journalEmptyText, defaultSiteSettings.journalEmptyText),
    notesEmptyText: normalizeString(input.notesEmptyText, defaultSiteSettings.notesEmptyText),
    gardenEmptyText: normalizeString(input.gardenEmptyText, defaultSiteSettings.gardenEmptyText),
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
    icpNumber: normalizeString(input.icpNumber, defaultSiteSettings.icpNumber),
    icpUrl: normalizeString(input.icpUrl, defaultSiteSettings.icpUrl),
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
