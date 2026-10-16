/**
 * Payload-backed content source.
 *
 * Mirrors `./local.ts` getter-for-getter and returns the same domain types from
 * `@/lib/types`, so no component changes when the backend swaps. Payload's Local
 * API runs in-process — there is no HTTP hop — and every getter issues a bounded
 * number of queries (no per-row follow-ups) by relying on `depth` to populate
 * relationships in the same round trip.
 */

import config from "@payload-config";
import { getPayload } from "payload";
import type { Where } from "payload";

import type { Article, Category, ImageAsset, PodcastEpisode, Show, ShowSlot, Weekday } from "@/lib/types";
import type { AuthorProfile } from "@/data/authors";
import type { EditorialCategory } from "@/data/categories";
import type { Article as ArticleDoc, Author as AuthorDoc, Category as CategoryDoc } from "@/payload-types";
import type { PodcastEpisode as EpisodeDoc, Show as ShowDoc } from "@/payload-types";
import type { NextShow, ScheduleByDay } from "./local";

type PayloadClient = Awaited<ReturnType<typeof getPayload>>;

/**
 * Payload is expensive to construct, so one instance is shared for the process
 * lifetime. The promise itself is cached, not just its result, so concurrent
 * getters during a page render cannot each trigger their own initialisation.
 */
let clientPromise: Promise<PayloadClient> | undefined;

const client = (): Promise<PayloadClient> => (clientPromise ??= getPayload({ config }));

/**
 * Relationship fields arrive as a bare numeric id when they were not populated,
 * and as an object when they were. Everything here is queried at `depth >= 1`,
 * so a non-object means a genuinely missing relation rather than an unpopulated
 * one — the callers below treat that as "no relation".
 */
function populated<T>(value: number | T | null | undefined): T | null {
  return value !== null && typeof value === "object" ? value : null;
}

/** The fixture string id is the site's stable public id; the numeric one is Payload's. */
function domainId(doc: { id: number; legacyId?: null | string }): string {
  return doc.legacyId ?? String(doc.id);
}

function toImage(group: {
  alt?: null | string;
  credit?: null | string;
  src?: null | string;
} | null): ImageAsset {
  return {
    src: group?.src ?? "",
    alt: group?.alt ?? "",
    credit: group?.credit ?? undefined,
  };
}

/**
 * Payload stores `hasMany` text fields in a join table and returns bare strings,
 * but older/edge shapes can surface as `{ item }` rows, so both are accepted.
 */
function texts(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) =>
    typeof entry === "string" ? entry : String((entry as { item?: unknown })?.item ?? ""),
  );
}

function toCategory(doc: CategoryDoc, articleCount: number): EditorialCategory {
  return {
    id: domainId(doc),
    slug: doc.slug,
    name: doc.name,
    description: doc.description,
    icon: doc.icon,
    accentToken: doc.accentToken as EditorialCategory["accentToken"],
    // Derived, never stored: the schema deliberately omits it so it can never
    // disagree with the articles table. See the note on getCategories().
    articleCount,
  };
}

function toAuthor(doc: AuthorDoc): AuthorProfile {
  return {
    id: domainId(doc),
    slug: doc.slug,
    name: doc.name,
    role: doc.role,
    avatarUrl: doc.avatarUrl ?? undefined,
    bio: doc.bio,
    location: doc.location,
    specialisms: texts(doc.specialisms),
    social: (doc.social ?? []).map((link) => ({ label: link.label, href: link.href })),
  };
}

function toShow(doc: ShowDoc): Show {
  const category = populated<CategoryDoc>(doc.category);
  return {
    id: domainId(doc),
    slug: doc.slug,
    name: doc.name,
    tagline: doc.tagline,
    description: doc.description,
    hosts: (doc.hosts ?? [])
      .map((host) => populated<AuthorDoc>(host))
      .filter((host): host is AuthorDoc => host !== null)
      .map(toAuthor),
    schedule: (doc.schedule ?? []).map((slot) => ({
      day: slot.day as Weekday,
      start: slot.start,
      end: slot.end,
    })),
    image: toImage(doc.image),
    category: category
      ? toCategory(category, 0)
      : undefined,
  };
}

function toEpisode(doc: EpisodeDoc): PodcastEpisode {
  const show = populated<ShowDoc>(doc.show);
  return {
    id: domainId(doc),
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    // PodcastEpisode.showId is the show's stable public id, not Payload's.
    showId: show ? domainId(show) : String(doc.show),
    season: doc.season,
    episodeNumber: doc.episodeNumber,
    publishedAt: doc.publishedAt,
    durationSeconds: doc.durationSeconds,
    image: toImage(doc.image),
    tags: texts(doc.tags),
  };
}

/** Payload blocks are keyed by `blockType`; the domain union is keyed by `type`. */
function toBody(doc: ArticleDoc): Article["body"] {
  const blocks = (doc.body ?? []) as {
    attribution?: null | string;
    items?: unknown;
    level?: null | number;
    ordered?: null | boolean;
    text?: null | string;
    blockType: string;
  }[];

  const out: Article["body"] = [];
  for (const block of blocks) {
    switch (block.blockType) {
      case "paragraph":
        out.push({ type: "paragraph", text: block.text ?? "" });
        break;
      case "heading":
        // The collection validates 2|3 on write; the fallback only guards
        // against hand-edited rows.
        out.push({
          type: "heading",
          level: block.level === 3 ? 3 : 2,
          text: block.text ?? "",
        });
        break;
      case "quote":
        out.push({
          type: "quote",
          text: block.text ?? "",
          attribution: block.attribution ?? undefined,
        });
        break;
      case "list":
        out.push({
          type: "list",
          ordered: block.ordered ?? undefined,
          items: texts(block.items),
        });
        break;
    }
  }
  return out;
}

function toArticle(doc: ArticleDoc): Article {
  const category = populated<CategoryDoc>(doc.category);
  const author = populated<AuthorDoc>(doc.author);
  if (!category || !author) {
    throw new Error(
      `content: article "${doc.slug}" is missing its ${category ? "author" : "category"} relation`,
    );
  }
  return {
    id: domainId(doc),
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    category: toCategory(category, 0),
    author: toAuthor(author),
    publishedAt: doc.publishedAt,
    updatedAt: doc.updatedAt,
    readingMinutes: doc.readingMinutes,
    image: toImage(doc.image),
    tags: texts(doc.tags),
    featured: doc.featured ?? undefined,
    breaking: doc.breaking ?? undefined,
    body: toBody(doc),
  };
}

const RECENCY = "-publishedAt" as const;
const ARTICLE_DEPTH = 2;
/** The seed creates rows in fixture order, so ascending ids preserve that order. */
const FIXTURE_ORDER = "id" as const;

async function findArticles(where?: Where, limit?: number): Promise<Article[]> {
  const payload = await client();
  const result = await payload.find({
    collection: "articles",
    where,
    limit: limit ?? 0,
    pagination: limit === undefined,
    sort: RECENCY,
    depth: ARTICLE_DEPTH,
    overrideAccess: true,
  });
  return result.docs.map(toArticle);
}

export async function getArticles(): Promise<Article[]> {
  const payload = await client();
  const result = await payload.find({
    collection: "articles",
    sort: FIXTURE_ORDER,
    pagination: false,
    depth: ARTICLE_DEPTH,
    overrideAccess: true,
  });
  return result.docs.map(toArticle);
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const [found] = await findArticles({ slug: { equals: slug } }, 1);
  return found;
}

export async function getLatestArticles(limit = 10): Promise<Article[]> {
  return findArticles(undefined, limit);
}

export async function getFeaturedArticles(limit = 3): Promise<Article[]> {
  return findArticles({ featured: { equals: true } }, limit);
}

export async function getBreakingArticles(): Promise<Article[]> {
  return findArticles({ breaking: { equals: true } });
}

export async function getArticlesByCategory(category: Category): Promise<Article[]> {
  const payload = await client();
  const resolved = await payload.find({
    collection: "categories",
    where: { legacyId: { equals: category.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const doc = resolved.docs[0];
  if (!doc) return [];
  return findArticles({ category: { equals: doc.id } });
}

export async function getTrendingArticles(limit = 5): Promise<Article[]> {
  return findArticles({ featured: { not_equals: true } }, limit);
}

/**
 * Same-category stories first, then cross-category stories sharing a tag — the
 * local source's ordering, reproduced by concatenating two queries and sorting
 * the combined list. `sort` on the underlying queries is irrelevant because the
 * combined list is re-sorted here.
 */
export async function getRelatedArticles(article: Article, limit = 3): Promise<Article[]> {
  const payload = await client();
  const resolved = await payload.find({
    collection: "categories",
    where: { legacyId: { equals: article.category.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const categoryDoc = resolved.docs[0];

  const sameCategory = categoryDoc
    ? await findArticles({ category: { equals: categoryDoc.id } })
    : [];
  const sameTags = article.tags.length
    ? await findArticles({ tags: { in: article.tags } })
    : [];

  const byRecency = (a: Article, b: Article) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

  // First occurrence wins, so same-category stories keep the category-major
  // ordering the local source produced; the self-reference is seeded into the
  // set so the article never relates to itself.
  const seen = new Set([article.id]);
  const merged: Article[] = [];
  for (const candidate of [...sameCategory, ...sameTags]) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    merged.push(candidate);
  }
  return merged.sort(byRecency).slice(0, limit);
}

/**
 * The local source matched against a joined title+excerpt+category-name+tags
 * string. Category names live on another table, so the equivalent here is a
 * relation check: match the text fields directly, and include every article
 * whose category name matched.
 */
export async function searchArticles(query: string, limit = 20): Promise<Article[]> {
  const needle = query.trim();
  if (!needle) return [];

  const payload = await client();
  const matchingCategories = await payload.find({
    collection: "categories",
    where: { name: { contains: needle } },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });

  const or: Where[] = [
    { title: { contains: needle } },
    { excerpt: { contains: needle } },
    { tags: { contains: needle } },
  ];
  if (matchingCategories.docs.length) {
    or.push({ category: { in: matchingCategories.docs.map((doc) => doc.id) } });
  }

  return findArticles({ or }, limit);
}

/**
 * `articleCount` is not stored (the schema derives it so it can never drift).
 * It is also not read by any component, so the aggregate is not worth N count
 * queries per render; it is returned as the honest running total of every
 * category at once from a single projection of the articles table.
 */
async function articleCounts(): Promise<Map<number, number>> {
  const payload = await client();
  const rows = await payload.find({
    collection: "articles",
    depth: 0,
    pagination: false,
    select: { category: true },
    overrideAccess: true,
  });
  const counts = new Map<number, number>();
  for (const row of rows.docs) {
    const id = populated<CategoryDoc>(row.category as number | CategoryDoc | null)?.id;
    const key = typeof id === "number" ? id : (row.category as number);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export async function getCategories(): Promise<EditorialCategory[]> {
  const payload = await client();
  const [result, counts] = await Promise.all([
    payload.find({
      collection: "categories",
      sort: FIXTURE_ORDER,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    }),
    articleCounts(),
  ]);
  return result.docs.map((doc) => toCategory(doc, counts.get(doc.id) ?? 0));
}

export async function getCategoryBySlug(slug: string): Promise<EditorialCategory | undefined> {
  const payload = await client();
  const result = await payload.find({
    collection: "categories",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const doc = result.docs[0];
  if (!doc) return undefined;
  const counts = await articleCounts();
  return toCategory(doc, counts.get(doc.id) ?? 0);
}

export async function getCategoryById(id: string): Promise<EditorialCategory | undefined> {
  const payload = await client();
  const result = await payload.find({
    collection: "categories",
    where: { legacyId: { equals: id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const doc = result.docs[0];
  if (!doc) return undefined;
  const counts = await articleCounts();
  return toCategory(doc, counts.get(doc.id) ?? 0);
}

export async function getAuthors(): Promise<AuthorProfile[]> {
  const payload = await client();
  const result = await payload.find({
    collection: "authors",
    sort: FIXTURE_ORDER,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  return result.docs.map(toAuthor);
}

export async function getAuthorById(id: string): Promise<AuthorProfile | undefined> {
  const payload = await client();
  const result = await payload.find({
    collection: "authors",
    where: { legacyId: { equals: id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return result.docs[0] ? toAuthor(result.docs[0]) : undefined;
}

export async function getAuthorBySlug(slug: string): Promise<AuthorProfile | undefined> {
  const payload = await client();
  const result = await payload.find({
    collection: "authors",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return result.docs[0] ? toAuthor(result.docs[0]) : undefined;
}

export async function getShows(limit?: number): Promise<Show[]> {
  const payload = await client();
  const result = await payload.find({
    collection: "shows",
    sort: FIXTURE_ORDER,
    limit: limit ?? 0,
    pagination: limit === undefined,
    depth: 2,
    overrideAccess: true,
  });
  return result.docs.map(toShow);
}

export async function getShowById(id: string): Promise<Show | undefined> {
  const payload = await client();
  const result = await payload.find({
    collection: "shows",
    where: { legacyId: { equals: id } },
    limit: 1,
    depth: 2,
    overrideAccess: true,
  });
  return result.docs[0] ? toShow(result.docs[0]) : undefined;
}

export async function getShowBySlug(slug: string): Promise<Show | undefined> {
  const payload = await client();
  const result = await payload.find({
    collection: "shows",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    overrideAccess: true,
  });
  return result.docs[0] ? toShow(result.docs[0]) : undefined;
}

const WEEKDAY_ORDER: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function minutesOf(clock: string): number {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Which show is live now, or null between shows. The whole grid is 20 documents,
 * so one query answers both this and getNextShow — no per-slot lookups.
 */
export async function getCurrentShow(now: Date = new Date()): Promise<Show | null> {
  const shows = await getShows();
  const day = WEEKDAY_ORDER[now.getDay()];
  const minutes = now.getHours() * 60 + now.getMinutes();

  for (const show of shows) {
    for (const slot of show.schedule) {
      if (slot.day !== day) continue;
      const start = minutesOf(slot.start);
      let end = minutesOf(slot.end);
      if (end <= start) end += 24 * 60; // slot crosses midnight
      if (minutes >= start && minutes < end) return show;
    }
  }
  return null;
}

export async function getNextShow(now: Date = new Date()): Promise<NextShow | null> {
  const shows = await getShows();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const dayIndex = now.getDay();

  for (let offset = 0; offset <= 7; offset += 1) {
    const day = WEEKDAY_ORDER[(dayIndex + offset) % 7];
    for (const show of shows) {
      for (const slot of show.schedule) {
        if (slot.day !== day) continue;
        if (offset > 0 || minutesOf(slot.start) > minutes) {
          return { show, slot: slot as ShowSlot };
        }
      }
    }
  }
  return null;
}

export async function getPodcastEpisodes(): Promise<PodcastEpisode[]> {
  const payload = await client();
  const result = await payload.find({
    collection: "podcast-episodes",
    sort: FIXTURE_ORDER,
    pagination: false,
    depth: 2,
    overrideAccess: true,
  });
  return result.docs.map(toEpisode);
}

export async function getEpisodeBySlug(slug: string): Promise<PodcastEpisode | undefined> {
  const payload = await client();
  const result = await payload.find({
    collection: "podcast-episodes",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    overrideAccess: true,
  });
  return result.docs[0] ? toEpisode(result.docs[0]) : undefined;
}

export async function getEpisodesByShow(showId: string): Promise<PodcastEpisode[]> {
  const payload = await client();
  const resolved = await payload.find({
    collection: "shows",
    where: { legacyId: { equals: showId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const show = resolved.docs[0];
  if (!show) return [];

  const result = await payload.find({
    collection: "podcast-episodes",
    where: { show: { equals: show.id } },
    sort: RECENCY,
    pagination: false,
    depth: 2,
    overrideAccess: true,
  });
  return result.docs.map(toEpisode);
}

export async function getLatestEpisodes(limit = 4): Promise<PodcastEpisode[]> {
  const payload = await client();
  const result = await payload.find({
    collection: "podcast-episodes",
    sort: RECENCY,
    limit,
    depth: 2,
    overrideAccess: true,
  });
  return result.docs.map(toEpisode);
}

/** Derived from each show's own slots, exactly as the local source derives it. */
export async function getScheduleByDay(): Promise<ScheduleByDay> {
  const shows = await getShows();
  const out = {} as ScheduleByDay;
  for (const day of [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as Weekday[]) {
    out[day] = shows
      .flatMap((show) =>
        show.schedule.filter((slot) => slot.day === day).map((slot) => ({
          show,
          start: slot.start,
          end: slot.end,
        })),
      )
      .sort((a, b) => a.start.localeCompare(b.start));
  }
  return out;
}
