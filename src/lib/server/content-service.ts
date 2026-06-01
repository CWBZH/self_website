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
    content: post.content,
  });
}

async function getPublishedCmsPosts() {
  return (await listCmsPosts()).map(toPublishedPost);
}

export async function getPublicContentPosts() {
  const cmsPosts = await getPublishedCmsPosts();
  return sortPosts([
    ...getStaticPublicPosts(),
    ...cmsPosts.filter((post) => post.visibility === "public"),
  ]);
}

export async function getContentPostsByType(type: PersonalPostType) {
  const cmsPosts = await getPublishedCmsPosts();
  return sortPosts([
    ...getStaticPostsByType(type),
    ...cmsPosts.filter((post) => post.type === type),
  ]);
}

export async function getGardenContentPosts() {
  const cmsPosts = await getPublishedCmsPosts();
  return sortPosts([
    ...getStaticGardenPosts(),
    ...cmsPosts.filter(
      (post) => post.visibility === "garden" || post.type === "garden"
    ),
  ]);
}

export async function getContentPostByRoute(
  type: PersonalPostType,
  slug: string
): Promise<PersonalPost | null> {
  const staticPost = getStaticPostsByType(type).find((post) => post.slug === slug);
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
