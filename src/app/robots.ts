// Kept at the app root rather than inside the (frontend) route group: Next
// 16.4 silently drops this metadata route when it lives in a route group —
// /robots.txt 404s — while sitemap.ts in the same directory still resolves.
// Verified against both `next dev` and `next build` on 16.4.0.
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/search" }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
