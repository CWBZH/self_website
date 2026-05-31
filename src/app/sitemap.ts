import { DATA } from "@/data/resume";
import { getPostPath, getPublicPosts } from "@/lib/content";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/journal", "/notes", "/room", "/about"].map(
    (route) => ({
      url: `${DATA.url}${route}`,
      lastModified: new Date(),
    })
  );

  const postRoutes = getPublicPosts().map((post) => ({
    url: `${DATA.url}${getPostPath(post)}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
  }));

  return [...staticRoutes, ...postRoutes];
}
