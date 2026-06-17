import type { MetadataRoute } from "next";

// Served at /sitemap.xml — the public, indexable pages. The daily games change
// every day, so they're marked daily/high priority. /h2h, /profile and /admin
// are intentionally omitted.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://tmdle.com";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/mapguessr`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/higherorlower`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];
}
