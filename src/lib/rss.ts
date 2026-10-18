export interface RssItemInput {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  durationSeconds: number | null;
  audioUrl: string | null;
  audioMimeType: string | null;
  audioByteLength: number | null;
  imageUrl?: string | null;
}

export interface RssChannelParams {
  title: string;
  selfUrl: string;
  siteUrl: string;
  description: string;
  language?: string;
  author: string;
  categories?: string[];
  guid: string;
  imageUrl?: string | null;
  episodeItems: string[];
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function formatItunesDuration(
  seconds: number | null | undefined,
): string | null {
  if (
    seconds === null ||
    seconds === undefined ||
    !Number.isInteger(seconds) ||
    seconds <= 0
  ) {
    return null;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

const ESCAPE_TARGETS: Record<string, string> = {
  "\u0026": "\u0026amp;",
  "<": "\u0026lt;",
  ">": "\u0026gt;",
  '"': "\u0026quot;",
  "'": "\u0026apos;",
};

export function escapeXml(value: string): string {
  return value.replace(
    /\u0026(?![a-zA-Z][a-zA-Z0-9]*;|#\d+;|#x[0-9a-fA-F]+;)|[<>"']/g,
    (character) => ESCAPE_TARGETS[character] ?? character,
  );
}

export function toRssItem(episode: RssItemInput, siteUrl: string): string {
  const site = trimTrailingSlash(siteUrl);
  const link = `${site}/podcasts#${episode.slug}`;
  const pubDate = new Date(episode.publishedAt).toUTCString();
  let item = `<item><title>${escapeXml(episode.title)}</title><link>${link}</link><description>${escapeXml(episode.description)}</description><guid isPermaLink="false">${episode.slug}</guid><pubDate>${pubDate}</pubDate>`;
  const duration = formatItunesDuration(episode.durationSeconds);
  if (duration !== null) {
    item += `<itunes:duration>${duration}</itunes:duration>`;
  }
  if (episode.audioUrl !== null && episode.audioMimeType !== null) {
    if (episode.audioByteLength === null) {
      item += `<enclosure url="${escapeXml(episode.audioUrl)}" type="${escapeXml(episode.audioMimeType)}"/>`;
    } else {
      item += `<enclosure url="${escapeXml(episode.audioUrl)}" type="${escapeXml(episode.audioMimeType)}" length="${episode.audioByteLength}"/>`;
    }
  }
  if (episode.imageUrl) {
    item += `<itunes:image href="${escapeXml(episode.imageUrl)}"/>`;
  }
  return `${item}</item>`;
}

export function buildRssChannel(params: RssChannelParams): string {
  const site = trimTrailingSlash(params.siteUrl);
  const stamp = new Date().toUTCString();
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:podcast="https://podcastindex.org/namespace/1.0" xmlns:atom="http://www.w3.org/2005/Atom">',
  );
  lines.push("<channel>");
  lines.push(`<title>${escapeXml(params.title)}</title>`);
  lines.push(`<link>${site}</link>`);
  lines.push(
    `<atom:link rel="self" type="application/rss+xml" href="${escapeXml(params.selfUrl)}"/>`,
  );
  lines.push(`<description>${escapeXml(params.description)}</description>`);
  lines.push(`<language>${params.language ?? "en-gh"}</language>`);
  lines.push(`<podcast:guid>${params.guid}</podcast:guid>`);
  lines.push(`<lastBuildDate>${stamp}</lastBuildDate>`);
  lines.push(`<pubDate>${stamp}</pubDate>`);
  lines.push(`<itunes:author>${escapeXml(params.author)}</itunes:author>`);
  lines.push("<itunes:explicit>false</itunes:explicit>");
  if (params.imageUrl) {
    lines.push(`<itunes:image href="${escapeXml(params.imageUrl)}"/>`);
    lines.push(
      `<image><link>${site}</link><title>${escapeXml(params.title)}</title><url>${escapeXml(params.imageUrl)}</url></image>`,
    );
  }
  const categories = params.categories ?? ["News"];
  for (const category of categories) {
    lines.push(`<itunes:category text="${escapeXml(category)}"/>`);
  }
  lines.push(...params.episodeItems);
  lines.push("</channel>");
  lines.push("</rss>");
  return lines.join("\n");
}
