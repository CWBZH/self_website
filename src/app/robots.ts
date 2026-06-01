import { getSiteSettings } from "@/lib/server/site-settings";
import type { MetadataRoute } from "next";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/garden", "/garden/", "/studio", "/studio/", "/api/"],
      },
    ],
    sitemap: `${settings.siteUrl}/sitemap.xml`,
  };
}
