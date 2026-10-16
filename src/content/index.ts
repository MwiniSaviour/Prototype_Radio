/**
 * Public content API — import getters from "@/content", never from "@/data".
 *
 * Every getter is async so call sites do not change when the backend swaps.
 * `./source` resolves CONTENT_SOURCE; the two implementations in `./local` and
 * `./payload` are structurally identical, and this file is the only place that
 * decides which one is live. Neither backend is imported by any client
 * component, so the Payload runtime never reaches the browser bundle.
 */

import { contentSource } from "./source";
import * as localBackend from "./local";
import * as payloadBackend from "./payload";

export { contentSource, type ContentSource } from "./source";
export type { NextShow, ScheduleByDay, ScheduleEntry } from "./local";

const backend = contentSource === "payload" ? payloadBackend : localBackend;

export const {
  getArticles,
  getArticleBySlug,
  getLatestArticles,
  getFeaturedArticles,
  getBreakingArticles,
  getArticlesByCategory,
  getTrendingArticles,
  getRelatedArticles,
  searchArticles,
  getCategories,
  getCategoryBySlug,
  getCategoryById,
  getAuthors,
  getAuthorById,
  getAuthorBySlug,
  getShows,
  getShowById,
  getShowBySlug,
  getCurrentShow,
  getNextShow,
  getPodcastEpisodes,
  getEpisodeBySlug,
  getEpisodesByShow,
  getLatestEpisodes,
  getScheduleByDay,
} = backend;
