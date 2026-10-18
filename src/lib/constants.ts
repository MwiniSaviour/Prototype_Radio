import type { NavItem, SocialLink } from "./types";

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "W93.5 FM",
  shortName: "93.5",
  legalName: "W93.5 FM Broadcasting",
  tagline: "Live radio. Real stories. Every hour.",
  description:
    "W93.5 FM is an independent broadcaster and newsroom: live shows around the clock, in-depth reporting from the communities we serve, and podcasts you can take with you.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://w93-5fm.example",
  locale: "en_US",
  /** localStorage key for the persisted theme choice (see ThemeToggle + layout script). */
  themeStorageKey: "radio-waa-theme",
  themeColors: {
    light: "#FBFAF7",
    dark: "#0F0E13",
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Shows", href: "/shows" },
    { label: "Podcasts", href: "/podcasts" },
    { label: "About", href: "/about" },
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
    { label: "RSS", href: "/feeds/w93-5.xml" },
  ] satisfies SocialLink[],
} as const;
