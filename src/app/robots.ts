import type { MetadataRoute } from "next";

// Served at /robots.txt — lets search engines crawl everything public and
// points them at the sitemap. /admin is gated and not worth crawling.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin"],
    },
    sitemap: "https://tmdle.com/sitemap.xml",
    host: "https://tmdle.com",
  };
}
