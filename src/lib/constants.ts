import type { NavItem, SocialLink } from "./types";

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Prototype Radio",
  shortName: "PROTOTYPE",
  legalName: "Prototype Radio Broadcasting",
  tagline: "The Voice of Wa.",
  description:
    "Prototype Radio is a broadcaster and newsroom in Wa, Upper West Region: live shows around the clock, reporting from the communities we serve, and podcasts you can take with you.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://radio-waa.example",
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
