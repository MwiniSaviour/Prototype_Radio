/**
 * Fixture-backed content source. Every getter is async even though the src/data
 * lookups resolve synchronously: the Payload Local API that replaces them is
 * async, so call sites must already be written that way.
 */

import type { Article, Category, PodcastEpisode, Show, ShowSlot, Weekday } from "@/lib/types";
import type { AuthorProfile } from "@/data/authors";
import type { EditorialCategory } from "@/data/categories";
import * as articleFixtures from "@/data/articles";
import * as authorFixtures from "@/data/authors";
import * as categoryFixtures from "@/data/categories";
import * as navFixtures from "@/data/nav";
import * as podcastFixtures from "@/data/podcasts";
import * as showFixtures from "@/data/shows";

export interface NextShow {
  show: Show;
  slot: ShowSlot;
}

export interface ScheduleEntry {
  show: Show;
  start: string;
  end: string;
}

export type ScheduleByDay = Record<Weekday, ScheduleEntry[]>;

export async function getArticles(): Promise<Article[]> {
  return articleFixtures.articles;
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  return articleFixtures.getArticleBySlug(slug);
}

export async function getLatestArticles(limit = 10): Promise<Article[]> {
  return articleFixtures.getLatestArticles(limit);
}

export async function getFeaturedArticles(limit = 3): Promise<Article[]> {
  return articleFixtures.getFeaturedArticles(limit);
}

export async function getBreakingArticles(): Promise<Article[]> {
  return articleFixtures.getBreakingArticles();
}

export async function getArticlesByCategory(category: Category): Promise<Article[]> {
  return articleFixtures.getArticlesByCategory(category);
}

export async function getTrendingArticles(limit = 5): Promise<Article[]> {
  return articleFixtures.getTrendingArticles(limit);
}

export async function getRelatedArticles(article: Article, limit = 3): Promise<Article[]> {
  return articleFixtures.getRelatedArticles(article, limit);
}

export async function searchArticles(query: string, limit = 20): Promise<Article[]> {
  return articleFixtures.searchArticles(query, limit);
}

export async function getCategories(): Promise<EditorialCategory[]> {
  return categoryFixtures.categories;
}

export async function getCategoryBySlug(slug: string): Promise<EditorialCategory | undefined> {
  return categoryFixtures.getCategoryBySlug(slug);
}

export async function getCategoryById(id: string): Promise<EditorialCategory | undefined> {
  return categoryFixtures.getCategoryById(id);
}

export async function getAuthors(): Promise<AuthorProfile[]> {
  return authorFixtures.authors;
}

export async function getAuthorById(id: string): Promise<AuthorProfile | undefined> {
  return authorFixtures.getAuthorById(id);
}

export async function getAuthorBySlug(slug: string): Promise<AuthorProfile | undefined> {
  return authorFixtures.getAuthorBySlug(slug);
}

export async function getShows(limit?: number): Promise<Show[]> {
  return showFixtures.getShows(limit);
}

export async function getShowById(id: string): Promise<Show | undefined> {
  return showFixtures.getShowById(id);
}

export async function getShowBySlug(slug: string): Promise<Show | undefined> {
  return showFixtures.getShowBySlug(slug);
}

export async function getCurrentShow(now: Date = new Date()): Promise<Show | null> {
  return showFixtures.getCurrentShow(now);
}

export async function getNextShow(now: Date = new Date()): Promise<NextShow | null> {
  return showFixtures.getNextShow(now);
}

export async function getPodcastEpisodes(): Promise<PodcastEpisode[]> {
  return podcastFixtures.podcastEpisodes;
}

export async function getEpisodeBySlug(slug: string): Promise<PodcastEpisode | undefined> {
  return podcastFixtures.getEpisodeBySlug(slug);
}

export async function getEpisodesByShow(showId: string): Promise<PodcastEpisode[]> {
  return podcastFixtures.getEpisodesByShow(showId);
}

export async function getLatestEpisodes(limit = 4): Promise<PodcastEpisode[]> {
  return podcastFixtures.getLatestEpisodes(limit);
}

export async function getScheduleByDay(): Promise<ScheduleByDay> {
  return navFixtures.getScheduleByDay();
}
