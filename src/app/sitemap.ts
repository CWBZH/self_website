import { getPostPath } from "@/lib/content";
import { getPublicContentPosts } from "@/lib/server/content-service";
import { getSiteSettings } from "@/lib/server/site-settings";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, posts] = await Promise.all([
    getSiteSettings(),
    getPublicContentPosts(),
  ]);

  const staticRoutes = ["", "/journal", "/notes", "/room", "/about"].map(
    (route) => ({
      url: `${settings.siteUrl}${route}`,
      lastModified: new Date(),
    })
  );

  const postRoutes = posts.map((post) => ({
    url: `${settings.siteUrl}${getPostPath(post)}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
  }));

  return [...staticRoutes, ...postRoutes];
}
