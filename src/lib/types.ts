/** ISO-8601 timestamp string, e.g. "2026-10-14T06:30:00.000Z". */
export type IsoDate = string;

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface Author {
  id: string;
  name: string;
  role: string;
  /** Optional portrait URL; without it the Avatar falls back to initials. */
  avatarUrl?: string;
}

export interface ImageAsset {
  src: string;
  /** Descriptive alt text — required, never empty. */
  alt: string;
  credit?: string;
}

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "list"; ordered?: boolean; items: string[] };

export interface Article {
  id: string;
  slug: string;
  title: string;
  /** Standfirst / deck shown under the headline. */
  excerpt: string;
  category: Category;
  author: Author;
  publishedAt: IsoDate;
  updatedAt?: IsoDate;
  readingMinutes: number;
  image: ImageAsset;
  tags: string[];
  featured?: boolean;
  breaking?: boolean;
  body: ArticleBlock[];
  /** Optional SEO overrides for <head>; falls back to title/excerpt. */
  meta?: { title?: string; description?: string };
}

export interface ShowSlot {
  day: Weekday;
  /** 24h local time, "HH:MM". */
  start: string;
  end: string;
}

export interface Show {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  hosts: Author[];
  schedule: ShowSlot[];
  image: ImageAsset;
  category?: Category;
}

export interface PodcastEpisode {
  id: string;
  slug: string;
  title: string;
  description: string;
  showId: string;
  season: number;
  episodeNumber: number;
  publishedAt: IsoDate;
  durationSeconds: number;
  image: ImageAsset;
  tags: string[];
}

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface SocialLink {
  label: string;
  href: string;
}
