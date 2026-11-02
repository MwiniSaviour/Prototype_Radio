import type { NavItem, SocialLink } from "./types";

/**
 * Canonical origin for absolute URLs (sitemap, canonical tags, OpenGraph, and
 * the origin Payload's admin posts back to).
 *
 * NEXT_PUBLIC_SITE_URL is the explicit answer and always wins. If it is missing
 * on Vercel, fall back to the project's stable production host — a deploy with
 * the real domain beaten by a placeholder is an SEO problem that is invisible
 * until someone notices the canonicals.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercelProductionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProductionHost) return `https://${vercelProductionHost}`;

  return "https://radio-waa.example";
}

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Prototype Radio",
  shortName: "PROTOTYPE",
  legalName: "Prototype Radio Broadcasting",
  tagline: "The Voice of Wa.",
  description:
    "Prototype Radio is a broadcaster and newsroom in Wa, Upper West Region: live shows around the clock, reporting from the communities we serve, and podcasts you can take with you.",
  url: resolveSiteUrl(),
  locale: "en_US",
  /** localStorage key for the persisted theme choice (see ThemeToggle + layout script). */
  themeStorageKey: "radio-waa-theme",
  themeColors: {
    light: "#F7F5F1",
    dark: "#0F0E0D",
  },
  /*
   * The masthead's section rail. Ordered like a newspaper front page: the
   * homepage, the desks the station reports on, then the listening surfaces.
   */
  nav: [
    { label: "News", href: "/" },
    { label: "Ghana", href: "/category/local-news" },
    { label: "Politics", href: "/category/politics" },
    { label: "Business", href: "/category/business" },
    { label: "Tech", href: "/category/technology" },
    { label: "Sports", href: "/category/sports" },
    { label: "Culture", href: "/category/entertainment" },
    { label: "Shows", href: "/shows" },
    { label: "Podcasts", href: "/podcasts" },
  ] satisfies NavItem[],
  footerNav: [
    {
      title: "Sections",
      links: [
        { label: "Top stories", href: "/" },
        { label: "Shows", href: "/shows" },
        { label: "Podcasts", href: "/podcasts" },
        { label: "About", href: "/about" },
      ],
    },
    {
      title: "Newsroom",
      links: [
        { label: "Editorial standards", href: "/about#editorial-standards" },
        { label: "Contact the newsroom", href: "/about#contact" },
      ],
    },
  ] satisfies { title: string; links: NavItem[] }[],
  socials: [
    { label: "X", href: "https://x.com/" },
    { label: "Facebook", href: "https://facebook.com/" },
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "YouTube", href: "https://youtube.com/" },
    { label: "RSS", href: "/podcasts" },
  ] satisfies SocialLink[],
} as const;
