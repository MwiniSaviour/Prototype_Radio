import type { MetadataRoute } from "next";
import { getArticles, getCategories, getPodcastEpisodes, getShows } from "@/content";
import { absoluteUrl } from "@/lib/seo";

const staticRoutes: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/shows", priority: 0.8 },
  { path: "/podcasts", priority: 0.8 },
  { path: "/about", priority: 0.6 },
  { path: "/category", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [articles, categories, shows, podcastEpisodes] = await Promise.all([
    getArticles(),
    getCategories(),
    getShows(),
    getPodcastEpisodes(),
  ]);

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: route.priority,
    })),
    ...categories.map((category) => ({
      url: absoluteUrl(`/category/${category.slug}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/article/${article.slug}`),
      lastModified: new Date(article.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...shows.map((show) => ({
      url: `${absoluteUrl("/shows")}#${show.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...podcastEpisodes.map((episode) => ({
      url: `${absoluteUrl("/podcasts")}#${episode.slug}`,
      lastModified: new Date(episode.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    {
      url: absoluteUrl("/feeds/w93-5.xml"),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    },
  ];
}

// Search is a query-driven route and is not worth listing.
export const revalidate = 3600;
