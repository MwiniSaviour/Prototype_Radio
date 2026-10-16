/**
 * Fictional demo data for UI prototyping. Navigation labels, footer grouping,
 * ticker copy and schedule framing are invented for the prototype.
 *
 * The weekly programme grid itself is NOT duplicated here — it lives in
 * `shows.ts` as each show's own `schedule` slots so there is one source of
 * truth. This module derives the day-by-day view from those slots.
 */

import type { NavItem, SocialLink, Weekday } from "@/lib/types";
import { shows } from "./shows";
import { getCurrentShow } from "./shows";

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "News", href: "/category/local-news" },
  { label: "Politics", href: "/category/politics" },
  { label: "Business", href: "/category/business" },
  { label: "Sports", href: "/category/sports" },
  { label: "Shows", href: "/shows" },
  { label: "Podcasts", href: "/podcasts" },
  { label: "About", href: "/about" },
];

export const footerColumns: { heading: string; links: NavItem[] }[] = [
  {
    heading: "Sections",
    links: [
      { label: "Local News", href: "/category/local-news" },
      { label: "Politics", href: "/category/politics" },
      { label: "Business", href: "/category/business" },
      { label: "Sports", href: "/category/sports" },
      { label: "Entertainment", href: "/category/entertainment" },
      { label: "Weather & Traffic", href: "/category/weather-traffic" },
    ],
  },
  {
    heading: "Listen",
    links: [
      { label: "On Air Schedule", href: "/shows" },
      { label: "Podcasts", href: "/podcasts" },
      { label: "Breaking News", href: "/category/local-news" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    heading: "About",
    links: [
      { label: "Our Standards", href: "/about" },
      { label: "Contact the Newsroom", href: "/about#reach-the-newsroom" },
      { label: "Corrections", href: "/about#corrections" },
    ],
  },
];

export const socialLinks: SocialLink[] = [
  { label: "Facebook", href: "https://facebook.com/" },
  { label: "X", href: "https://x.com/" },
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "YouTube", href: "https://youtube.com/" },
];

/** Breaking ticker copy is demo text, wired to real article slugs where possible. */
export const breakingTicker: string[] = [
  "Jambia pumping station: water rationing in eight communities — live updates",
  "Upper West United hold SDD league leaders to a draw",
  "Mobile coverage extended to nine communities on the rural build",
  "Harmattan haze reduces dawn visibility — weather and traffic every hour",
];

const DAY_ORDER: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/** Schedule rows grouped by weekday, each row sorted by start time. */
export function getScheduleByDay(): Record<Weekday, { show: (typeof shows)[number]; start: string; end: string }[]> {
  const out = {} as Record<Weekday, { show: (typeof shows)[number]; start: string; end: string }[]>;
  for (const day of DAY_ORDER) {
    out[day] = shows
      .flatMap((show) => show.schedule.filter((s) => s.day === day).map((s) => ({ show, start: s.start, end: s.end })))
      .sort((a, b) => a.start.localeCompare(b.start));
  }
  return out;
}

export { getCurrentShow };