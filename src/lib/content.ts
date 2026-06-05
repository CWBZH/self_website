import { allPosts } from "content-collections";

export type PersonalPostType = "journal" | "note" | "garden";
export type PersonalPostVisibility = "public" | "garden";
export type PersonalPostSource = "mdx" | "cms";
export type PersonalPostLanguage = "zh" | "en";

export type PersonalPostTranslation = {
  title?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  readingTime?: string;
  updatedAt?: string;
};

export type PersonalPostTranslations = Partial<
  Record<PersonalPostLanguage, PersonalPostTranslation>
>;

export type PersonalPost = {
  id: string;
  source: PersonalPostSource;
  slug: string;
  title: string;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  summary: string;
  image?: string;
  cover?: string;
  type: PersonalPostType;
  visibility: PersonalPostVisibility;
  tags: string[];
  readingTime?: string;
  translations?: PersonalPostTranslations;
  mdx?: string;
  content?: string;
  _meta?: { path: string };
};

export type CmsContentRecord = Omit<PersonalPost, "source" | "_meta">;

type StaticPost = (typeof allPosts)[number];

function getStaticSlug(post: StaticPost) {
  return post._meta.path.replace(/\.mdx$/, "");
}

export function toStaticPersonalPost(post: StaticPost): PersonalPost {
  const slug = getStaticSlug(post);

  return {
    id: `mdx:${slug}`,
    source: "mdx",
    slug,
    title: post.title,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    author: post.author,
    summary: post.summary,
    image: post.image,
    cover: post.cover,
    type: post.type,
    visibility: post.visibility,
    tags: post.tags,
    readingTime: post.readingTime,
    mdx: post.mdx,
    content: post.content,
    _meta: post._meta,
  };
}

export function toCmsPersonalPost(post: CmsContentRecord): PersonalPost {
  return {
    ...post,
    source: "cms",
  };
}

export const staticPersonalPosts = allPosts.map(toStaticPersonalPost);

export function getPostSlug(post: PersonalPost | StaticPost) {
  if ("slug" in post) return post.slug;
  return getStaticSlug(post);
}

export function getPostCover(post: PersonalPost | StaticPost) {
  return post.cover ?? post.image ?? "/images/paper-window.svg";
}

export function sortPosts(posts: PersonalPost[]) {
  return posts
    .slice()
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

export function getPostPath(post: PersonalPost | StaticPost) {
  const slug = getPostSlug(post);

  if (post.type === "garden" || post.visibility === "garden") {
    return `/garden/${slug}`;
  }

  return `${getPostCollectionPath(post.type)}/${slug}`;
}

export function getPostCollectionPath(type: PersonalPostType) {
  if (type === "note") return "/notes";
  return `/${type}`;
}

export function resolveLanguage(value?: string | string[] | null): PersonalPostLanguage {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "en" ? "en" : "zh";
}

export function withLanguagePath(path: string, language: PersonalPostLanguage) {
  if (language !== "en" || path.startsWith("http") || path.startsWith("mailto:") || path.startsWith("#")) {
    return path;
  }

  const [pathname, hash = ""] = path.split("#");
  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}lang=en${hash ? `#${hash}` : ""}`;
}

export function localizePost(post: PersonalPost, language: PersonalPostLanguage): PersonalPost {
  if (language === "zh") return post;

  const translation = post.translations?.[language];
  if (!translation) return post;

  return {
    ...post,
    title: translation.title?.trim() || post.title,
    summary: translation.summary?.trim() || post.summary,
    content: translation.content?.trim() || post.content,
    tags: translation.tags?.length ? translation.tags : post.tags,
    readingTime: translation.readingTime?.trim() || post.readingTime,
  };
}

export function getStaticPostsByType(type: PersonalPostType) {
  return sortPosts(staticPersonalPosts.filter((post) => post.type === type));
}

export function getStaticPublicPosts() {
  return sortPosts(
    staticPersonalPosts.filter((post) => post.visibility === "public")
  );
}

export function getStaticGardenPosts() {
  return sortPosts(
    staticPersonalPosts.filter(
      (post) => post.visibility === "garden" || post.type === "garden"
    )
  );
}

export function getPublicPosts() {
  return getStaticPublicPosts();
}
