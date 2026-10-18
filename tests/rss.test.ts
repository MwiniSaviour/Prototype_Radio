import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildRssChannel,
  escapeXml,
  formatItunesDuration,
  toRssItem,
  type RssChannelParams,
  type RssItemInput,
} from "../src/lib/rss";

const baseEpisode: RssItemInput = {
  title: "Morning Drive",
  slug: "morning-drive",
  description: "Wakes the nation",
  publishedAt: "2026-10-17T10:30:00.000Z",
  durationSeconds: 5400,
  audioUrl: "https://cdn.example.com/morning-drive.mp3",
  audioMimeType: "audio/mpeg",
  audioByteLength: 5242880,
  imageUrl: "https://example.com/img.png",
};

const baseChannel: RssChannelParams = {
  title: "Waa Morning Drive",
  selfUrl: "https://example.com/feed.xml",
  siteUrl: "https://example.com/",
  description: "News & updates",
  author: "Radio Waa Limited",
  guid: "135bc6f2-df4a-5fcc-b7e7-97e03e5ee52f",
  episodeItems: ["<item>a</item>"],
};

test("formatItunesDuration formats valid exact-second values", () => {
  assert.equal(formatItunesDuration(7345), "2:02:25");
  assert.equal(formatItunesDuration(810), "13:30");
  assert.equal(formatItunesDuration(59), "0:59");
  assert.equal(formatItunesDuration(60), "1:00");
  assert.equal(formatItunesDuration(61), "1:01");
  assert.equal(formatItunesDuration(3600), "1:00:00");
  assert.equal(formatItunesDuration(3599), "59:59");
  assert.equal(formatItunesDuration(5400), "1:30:00");
});

test("formatItunesDuration returns null for invalid inputs", () => {
  assert.equal(formatItunesDuration(0), null);
  assert.equal(formatItunesDuration(-5), null);
  assert.equal(formatItunesDuration(null), null);
  assert.equal(formatItunesDuration(undefined), null);
  assert.equal(formatItunesDuration(Number.NaN), null);
  assert.equal(formatItunesDuration(Number.POSITIVE_INFINITY), null);
  assert.equal(formatItunesDuration(Number.NEGATIVE_INFINITY), null);
  assert.equal(formatItunesDuration(7345.5), null);
});

test("escapeXml escapes all five special characters", () => {
  assert.equal(escapeXml("<"), "\u0026lt;");
  assert.equal(escapeXml(">"), "\u0026gt;");
  assert.equal(escapeXml('"'), "\u0026quot;");
  assert.equal(escapeXml("'"), "\u0026apos;");
  assert.equal(escapeXml("\u0026"), "\u0026amp;");
  assert.equal(
    escapeXml("A \u0026 B < C > D \"E\" 'F'"),
    "A \u0026amp; B \u0026lt; C \u0026gt; D \u0026quot;E\u0026quot; \u0026apos;F\u0026apos;",
  );
});

test("escapeXml preserves existing well-formed entities", () => {
  assert.equal(escapeXml("AT\u0026amp;T Live"), "AT\u0026amp;T Live");
  assert.equal(escapeXml("AT\u0026T"), "AT\u0026amp;T");
  assert.equal(escapeXml("AT\u0026#38;T"), "AT\u0026#38;T");
  assert.equal(escapeXml("AT\u0026#x26;T"), "AT\u0026#x26;T");
});

test("toRssItem includes every element in canonical order", () => {
  assert.equal(
    toRssItem(baseEpisode, "https://example.com/"),
    '<item><title>Morning Drive</title><link>https://example.com/podcasts#morning-drive</link><description>Wakes the nation</description><guid isPermaLink="false">morning-drive</guid><pubDate>Sat, 17 Oct 2026 10:30:00 GMT</pubDate><itunes:duration>1:30:00</itunes:duration><enclosure url="https://cdn.example.com/morning-drive.mp3" type="audio/mpeg" length="5242880"/><itunes:image href="https://example.com/img.png"/></item>',
  );
});

test("toRssItem escapes XML specials in title and description", () => {
  const item = toRssItem(
    {
      ...baseEpisode,
      title: "<a \u0026 b>",
      description: 'x < y \u0026 "z" \'q\'',
    },
    "https://example.com",
  );
  assert.ok(item.includes("<title>\u0026lt;a \u0026amp; b\u0026gt;</title>"));
  assert.ok(
    item.includes(
      "<description>x \u0026lt; y \u0026amp; \u0026quot;z\u0026quot; \u0026apos;q\u0026apos;</description>",
    ),
  );
});

test("toRssItem omits the length attribute when audioByteLength is null", () => {
  const item = toRssItem(
    { ...baseEpisode, audioByteLength: null },
    "https://example.com",
  );
  assert.ok(
    item.includes(
      '<enclosure url="https://cdn.example.com/morning-drive.mp3" type="audio/mpeg"/>',
    ),
  );
  assert.ok(!item.includes(" length="));
});

test("toRssItem renders itunes:duration only for valid values", () => {
  const absent = toRssItem(
    { ...baseEpisode, durationSeconds: null },
    "https://example.com",
  );
  assert.ok(!absent.includes("<itunes:duration"));
  const valid = toRssItem(
    { ...baseEpisode, durationSeconds: 61 },
    "https://example.com",
  );
  assert.ok(valid.includes("<itunes:duration>1:01</itunes:duration>"));
});

test("toRssItem trims trailing slash from siteUrl", () => {
  const expectedLink =
    '<link>https://example.com/podcasts#morning-drive</link>';
  assert.ok(
    toRssItem(baseEpisode, "https://example.com/").includes(expectedLink),
  );
  assert.ok(
    toRssItem(baseEpisode, "https://example.com").includes(expectedLink),
  );
});

test("toRssItem omits the enclosure when audioUrl or audioMimeType is missing", () => {
  const noUrl = toRssItem(
    { ...baseEpisode, audioUrl: null },
    "https://example.com",
  );
  const noMime = toRssItem(
    { ...baseEpisode, audioMimeType: null },
    "https://example.com",
  );
  assert.ok(!noUrl.includes("<enclosure"));
  assert.ok(!noMime.includes("<enclosure"));
});

test("toRssItem renders itunes:image only when imageUrl is set", () => {
  const withoutImage = toRssItem(
    { ...baseEpisode, imageUrl: undefined },
    "https://example.com",
  );
  assert.ok(!withoutImage.includes("<itunes:image"));
  const withImage = toRssItem(
    { ...baseEpisode, imageUrl: "https://example.com/cover.png" },
    "https://example.com",
  );
  assert.ok(
    withImage.includes('<itunes:image href="https://example.com/cover.png"/>'),
  );
});

test("buildRssChannel emits declaration, namespaces and skeleton", () => {
  const channel = buildRssChannel(baseChannel);
  assert.ok(channel.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(channel.includes('<rss version="2.0"'));
  assert.ok(
    channel.includes(
      'xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"',
    ),
  );
  assert.ok(
    channel.includes('xmlns:podcast="https://podcastindex.org/namespace/1.0"'),
  );
  assert.ok(channel.includes('xmlns:atom="http://www.w3.org/2005/Atom"'));
  assert.ok(channel.includes("<channel>"));
  assert.ok(channel.endsWith("</channel>\n</rss>"));
});

test("buildRssChannel applies defaults and omits itunes:owner", () => {
  const channel = buildRssChannel(baseChannel);
  assert.ok(channel.includes("<language>en-gh</language>"));
  assert.ok(channel.includes('<itunes:category text="News"/>'));
  assert.ok(channel.includes("<itunes:explicit>false</itunes:explicit>"));
  assert.ok(!channel.includes("itunes:owner"));
});

test("buildRssChannel escapes metadata and renders the atom self link", () => {
  const channel = buildRssChannel({
    ...baseChannel,
    title: "We & T",
    description: "Bobby <3",
    author: "Radio's",
    categories: ["Top S&H"],
  });
  assert.ok(channel.includes("<title>We \u0026amp; T</title>"));
  assert.ok(channel.includes("<description>Bobby \u0026lt;3</description>"));
  assert.ok(channel.includes("<itunes:author>Radio\u0026apos;s</itunes:author>"));
  assert.ok(channel.includes('<itunes:category text="Top S\u0026amp;H"/>'));
  assert.ok(
    channel.includes(
      '<atom:link rel="self" type="application/rss+xml" href="https://example.com/feed.xml"/>',
    ),
  );
  assert.ok(channel.includes("<link>https://example.com</link>"));
  assert.ok(
    channel.includes(
      "<podcast:guid>135bc6f2-df4a-5fcc-b7e7-97e03e5ee52f</podcast:guid>",
    ),
  );
});

test("buildRssChannel stamps lastBuildDate and pubDate in RFC 822 GMT", () => {
  const channel = buildRssChannel(baseChannel);
  const stampRe =
    /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/;
  const lastBuild = channel.match(/<lastBuildDate>([^<]+)<\/lastBuildDate>/);
  const pubDate = channel.match(/<pubDate>([^<]+)<\/pubDate>/);
  assert.ok(lastBuild !== null && pubDate !== null);
  assert.equal(lastBuild[1], pubDate[1]);
  assert.ok(stampRe.test(lastBuild[1]));
  assert.equal((channel.match(/<pubDate>/g) ?? []).length, 1);
});

test("buildRssChannel renders image guard, categories and verbatim items", () => {
  const channel = buildRssChannel({
    ...baseChannel,
    imageUrl: "https://example.com/cover.png",
    categories: ["Top Stories", "S&H"],
    episodeItems: ["<item>first</item>", "<item>second</item>"],
  });
  assert.ok(
    channel.includes('<itunes:image href="https://example.com/cover.png"/>'),
  );
  assert.ok(
    channel.includes(
      "<image><link>https://example.com</link><title>Waa Morning Drive</title><url>https://example.com/cover.png</url></image>",
    ),
  );
  assert.ok(channel.includes('<itunes:category text="Top Stories"/>'));
  assert.ok(channel.includes('<itunes:category text="S\u0026amp;H"/>'));
  assert.ok(
    channel.indexOf("<image>") <
      channel.indexOf('<itunes:category text="Top Stories"/>'),
  );
  assert.ok(
    channel.indexOf("<item>first</item>") <
      channel.indexOf("<item>second</item>"),
  );
  assert.ok(
    channel.indexOf("<item>second</item>") < channel.indexOf("</channel>"),
  );
});
