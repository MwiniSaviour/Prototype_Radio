/**
 * Single entry point for all mock fixtures. Pages import from `@/data` rather
 * than reaching into individual modules, so the internal file layout can change
 * without touching components.
 */

export { articles, getArticleBySlug, getLatestArticles, getFeaturedArticles, getBreakingArticles, getArticlesByCategory, getTrendingArticles, getRelatedArticles, searchArticles } from "./articles";
export { categories, getCategoryBySlug, getCategoryById, type EditorialCategory } from "./categories";
export { authors, getAuthorById, getAuthorBySlug, type AuthorProfile } from "./authors";
export { shows, getShowById, getShowBySlug, getShows, getCurrentShow, getNextShow } from "./shows";
export { podcastEpisodes, getEpisodeBySlug, getEpisodesByShow, getLatestEpisodes } from "./podcasts";
export { primaryNav, footerColumns, breakingTicker } from "./nav";