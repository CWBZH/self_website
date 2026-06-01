import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  CmsContentRecord,
  PersonalPostType,
  PersonalPostVisibility,
} from "@/lib/content";

export type CmsPostStatus = "draft" | "published";

export type StoredCmsPost = CmsContentRecord & {
  status: CmsPostStatus;
  createdAt: string;
};

type CmsStore = {
  posts: StoredCmsPost[];
};

type CmsPostInput = {
  slug?: string;
  title?: string;
  summary?: string;
  content?: string;
  cover?: string;
  image?: string;
  type?: PersonalPostType;
  visibility?: PersonalPostVisibility;
  status?: CmsPostStatus;
  tags?: string[];
  readingTime?: string;
  publishedAt?: string;
  author?: string;
};

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "content-store.json");
export const uploadDir = path.join(dataDir, "uploads");

const postTypes: PersonalPostType[] = ["journal", "note", "garden"];
const visibilities: PersonalPostVisibility[] = ["public", "garden"];
const statuses: CmsPostStatus[] = ["draft", "published"];

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-\u4e00-\u9fa5]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || `post-${Date.now()}`;
}

function normalizeTags(tags: unknown) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .slice(0, 12);
}

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
  await mkdir(uploadDir, { recursive: true });
}

async function readStore(): Promise<CmsStore> {
  await ensureStore();

  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<CmsStore>;
    return { posts: Array.isArray(parsed.posts) ? parsed.posts : [] };
  } catch {
    return { posts: [] };
  }
}

async function writeStore(store: CmsStore) {
  await ensureStore();
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function normalizeInput(input: CmsPostInput, current?: StoredCmsPost) {
  const now = new Date().toISOString();
  const title = String(input.title ?? current?.title ?? "Untitled").trim();
  const type = postTypes.includes(input.type as PersonalPostType)
    ? (input.type as PersonalPostType)
    : current?.type ?? "journal";
  const visibility =
    type === "garden"
      ? "garden"
      : visibilities.includes(input.visibility as PersonalPostVisibility)
        ? (input.visibility as PersonalPostVisibility)
        : current?.visibility ?? "public";
  const status = statuses.includes(input.status as CmsPostStatus)
    ? (input.status as CmsPostStatus)
    : current?.status ?? "draft";

  return {
    title,
    slug: slugify(input.slug ?? current?.slug ?? title),
    summary: String(input.summary ?? current?.summary ?? "").trim(),
    content: String(input.content ?? current?.content ?? "").trim(),
    cover: String(input.cover ?? current?.cover ?? "").trim() || undefined,
    image: String(input.image ?? current?.image ?? "").trim() || undefined,
    type,
    visibility,
    status,
    tags: normalizeTags(input.tags ?? current?.tags ?? []),
    readingTime:
      String(input.readingTime ?? current?.readingTime ?? "").trim() || undefined,
    author: String(input.author ?? current?.author ?? "").trim() || undefined,
    publishedAt: String(input.publishedAt ?? current?.publishedAt ?? now).trim(),
    updatedAt: now,
  };
}

function makeUniqueSlug(posts: StoredCmsPost[], slug: string, id?: string) {
  let candidate = slug;
  let index = 2;

  while (posts.some((post) => post.slug === candidate && post.id !== id)) {
    candidate = `${slug}-${index}`;
    index += 1;
  }

  return candidate;
}

export async function listCmsPosts(options: { includeDrafts?: boolean } = {}) {
  const store = await readStore();
  const posts = options.includeDrafts
    ? store.posts
    : store.posts.filter((post) => post.status === "published");

  return posts
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.publishedAt).getTime() -
        new Date(a.updatedAt ?? a.publishedAt).getTime()
    );
}

export async function getCmsPostById(id: string) {
  const store = await readStore();
  return store.posts.find((post) => post.id === id) ?? null;
}

export async function getCmsPostByRoute(type: PersonalPostType, slug: string) {
  const store = await readStore();
  return (
    store.posts.find(
      (post) =>
        post.status === "published" && post.type === type && post.slug === slug
    ) ?? null
  );
}

export async function createCmsPost(input: CmsPostInput) {
  const store = await readStore();
  const normalized = normalizeInput(input);
  const post: StoredCmsPost = {
    id: randomUUID(),
    ...normalized,
    slug: makeUniqueSlug(store.posts, normalized.slug),
    createdAt: new Date().toISOString(),
  };

  store.posts.unshift(post);
  await writeStore(store);
  return post;
}

export async function updateCmsPost(id: string, input: CmsPostInput) {
  const store = await readStore();
  const index = store.posts.findIndex((post) => post.id === id);

  if (index === -1) return null;

  const current = store.posts[index];
  const normalized = normalizeInput(input, current);
  const updated: StoredCmsPost = {
    ...current,
    ...normalized,
    id: current.id,
    slug: makeUniqueSlug(store.posts, normalized.slug, current.id),
    createdAt: current.createdAt,
  };

  store.posts[index] = updated;
  await writeStore(store);
  return updated;
}

export async function deleteCmsPost(id: string) {
  const store = await readStore();
  const nextPosts = store.posts.filter((post) => post.id !== id);

  if (nextPosts.length === store.posts.length) return false;

  await writeStore({ posts: nextPosts });
  return true;
}
