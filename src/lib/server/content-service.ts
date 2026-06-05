import {
  getStaticGardenPosts,
  getStaticPostsByType,
  getStaticPublicPosts,
  sortPosts,
  toCmsPersonalPost,
  type PersonalPost,
  type PersonalPostType,
} from "@/lib/content";
import {
  getCmsPostByRoute,
  listCmsPosts,
  type StoredCmsPost,
} from "@/lib/server/content-store";
import { getSiteSettings } from "@/lib/server/site-settings";

function toPublishedPost(post: StoredCmsPost) {
  return toCmsPersonalPost({
    id: post.id,
    slug: post.slug,
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
    translations: post.translations,
    content: post.content,
  });
}

async function getPublishedCmsPosts() {
  return (await listCmsPosts()).map(toPublishedPost);
}

export async function getPublicContentPosts() {
  const [cmsPosts, settings] = await Promise.all([
    getPublishedCmsPosts(),
    getSiteSettings(),
  ]);
  return sortPosts([
    ...(settings.showStaticMdxContent ? getStaticPublicPosts() : []),
    ...cmsPosts.filter((post) => post.visibility === "public"),
  ]);
}

export async function getContentPostsByType(type: PersonalPostType) {
  const [cmsPosts, settings] = await Promise.all([
    getPublishedCmsPosts(),
    getSiteSettings(),
  ]);
  return sortPosts([
    ...(settings.showStaticMdxContent ? getStaticPostsByType(type) : []),
    ...cmsPosts.filter((post) => post.type === type),
  ]);
}

export async function getGardenContentPosts() {
  const [cmsPosts, settings] = await Promise.all([
    getPublishedCmsPosts(),
    getSiteSettings(),
  ]);
  return sortPosts([
    ...(settings.showStaticMdxContent ? getStaticGardenPosts() : []),
    ...cmsPosts.filter(
      (post) => post.visibility === "garden" || post.type === "garden"
    ),
  ]);
}

export async function getContentPostByRoute(
  type: PersonalPostType,
  slug: string
): Promise<PersonalPost | null> {
  const settings = await getSiteSettings();
  const staticPost = settings.showStaticMdxContent
    ? getStaticPostsByType(type).find((post) => post.slug === slug)
    : null;
  if (staticPost) return staticPost;

  const cmsPost = await getCmsPostByRoute(type, slug);
  return cmsPost ? toPublishedPost(cmsPost) : null;
}

export async function getAdjacentContentPosts(type: PersonalPostType, slug: string) {
  const posts = await getContentPostsByType(type);
  const index = posts.findIndex((post) => post.slug === slug);

  return {
    previousPost: index > 0 ? posts[index - 1] : null,
    nextPost: index >= 0 && index < posts.length - 1 ? posts[index + 1] : null,
  };
}
