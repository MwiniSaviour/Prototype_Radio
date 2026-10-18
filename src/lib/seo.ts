import type { Metadata } from "next";
import { siteConfig } from "./constants";

interface MetadataInput {
  title?: string;
  description?: string;
  /** Site-absolute path, e.g. "/shows". Used for the canonical URL and og:url. */
  path?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  keywords?: string[];
  noindex?: boolean;
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteConfig.url).toString();
}

/**
 * Single entry point for page metadata: canonical URLs, OpenGraph, Twitter
 * cards, robots directives. Always returns site-level defaults when called
 * with no input (used by the root layout).
 */
export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  keywords,
  noindex = false,
}: MetadataInput = {}): Metadata {
  const composedTitle = title
    ? `${title} | ${siteConfig.name}`
    : `${siteConfig.name} — ${siteConfig.tagline}`;
  const composedDescription = description ?? siteConfig.description;
  const url = absoluteUrl(path);
  // Provided by the design-assets agent; falls back until it exists in public/.
  const ogImage = image ?? absoluteUrl("/assets/images/og-default.png");

  return {
    metadataBase: new URL(siteConfig.url),
    title: composedTitle,
    description: composedDescription,
    applicationName: siteConfig.name,
    keywords,
    alternates: {
      canonical: url,
      types: { "application/rss+xml": "/feeds/w93-5.xml" },
    },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: composedTitle,
      description: composedDescription,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: composedTitle }],
      ...(type === "article"
        ? { publishedTime, modifiedTime, authors }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: composedTitle,
      description: composedDescription,
      images: [ogImage],
    },
  };
}
