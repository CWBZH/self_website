import { allPosts } from "content-collections";

export type PersonalPost = (typeof allPosts)[number];
export type PersonalPostType = PersonalPost["type"];

export function getPostSlug(post: PersonalPost) {
  return post._meta.path.replace(/\.mdx$/, "");
}

export function getPostCover(post: PersonalPost) {
  return post.cover ?? post.image ?? "/images/paper-window.svg";
}

export function getSortedPosts(posts: PersonalPost[] = allPosts) {
  return [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getPostsByType(type: PersonalPostType) {
  return getSortedPosts(allPosts.filter((post) => post.type === type));
}

export function getPublicPosts() {
  return getSortedPosts(
    allPosts.filter((post) => post.visibility !== "garden")
  );
}

export function getGardenPosts() {
  return getSortedPosts(
    allPosts.filter(
      (post) => post.visibility === "garden" || post.type === "garden"
    )
  );
}

export function getPostByRoute(type: PersonalPostType, slug: string) {
  const posts = type === "garden" ? getGardenPosts() : getPostsByType(type);
  return posts.find((post) => getPostSlug(post) === slug);
}

export function getAdjacentPosts(type: PersonalPostType, slug: string) {
  const posts = type === "garden" ? getGardenPosts() : getPostsByType(type);
  const currentIndex = posts.findIndex((post) => getPostSlug(post) === slug);

  return {
    previousPost: currentIndex > 0 ? posts[currentIndex - 1] : null,
    nextPost:
      currentIndex >= 0 && currentIndex < posts.length - 1
        ? posts[currentIndex + 1]
        : null,
  };
}

export function getPostPath(post: PersonalPost) {
  const slug = getPostSlug(post);

  if (post.type === "note") {
    return `/notes/${slug}`;
  }

  if (post.type === "garden" || post.visibility === "garden") {
    return `/garden/${slug}`;
  }

  return `/journal/${slug}`;
}
