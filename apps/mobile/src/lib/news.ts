import type { Article } from "@shared/lib/types";
import { articles } from "@shared/data/articles";

/**
 * The newsroom view of the shared article fixtures. Everything is derived from
 * `src/data/articles.ts` — same stories, same images, same bylines as the web.
 */

const byNewest = (a: Article, b: Article) =>
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

/** Stories carrying the breaking flag, newest first. */
export const breakingStories: Article[] = articles.filter((a) => a.breaking).sort(byNewest);

/** The lead carousel: the editor's picks first, then the most recent stories. */
export const leadStories: Article[] = (() => {
  const featured = articles.filter((a) => a.featured).sort(byNewest);
  const rest = articles.filter((a) => !a.featured).sort(byNewest);
  return [...featured, ...rest].slice(0, 10);
})();

/** Everything that is not already leading the carousel. */
export const latestStories: Article[] = (() => {
  const leads = new Set(leadStories.map((a) => a.id));
  return articles.filter((a) => !leads.has(a.id)).sort(byNewest);
})();

export function findArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}
