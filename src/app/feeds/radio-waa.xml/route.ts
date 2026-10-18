import { getPodcastEpisodes } from "@/content";
import { siteConfig } from "@/lib/constants";
import { buildRssChannel, toRssItem } from "@/lib/rss";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 600;

// Stable podcast-identity tag per the podcast-namespace spec; generated once
// when the feed went live and never regenerated across releases (readers key
// subscriptions on it).
const CHANNEL_GUID = "135bc6f2-df4a-5fcc-b7e7-97e03e5ee52f";

export async function GET(): Promise<Response> {
  const episodes = await getPodcastEpisodes();

  // Enclosure-less entries are in-page playlists, not downloadable audio —
  // feed managers reject items that fail enclosure validation.
  const items = episodes
    .filter((episode) => episode.audioUrl != null)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .map((episode) =>
      toRssItem(
        {
          title: episode.title,
          slug: episode.slug,
          description: episode.description,
          publishedAt: episode.publishedAt,
          durationSeconds: episode.durationSeconds,
          audioUrl: episode.audioUrl ?? null,
          audioMimeType: episode.audioMimeType ?? null,
          audioByteLength: episode.audioByteLength ?? null,
          imageUrl: absoluteUrl(episode.image.src),
        },
        absoluteUrl("/"),
      ),
    );

  const xml = buildRssChannel({
    title: `${siteConfig.name} — All Episodes`,
    description: siteConfig.tagline,
    author: siteConfig.legalName,
    selfUrl: absoluteUrl("/feeds/radio-waa.xml"),
    siteUrl: absoluteUrl("/"),
    guid: CHANNEL_GUID,
    episodeItems: items,
  });

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
