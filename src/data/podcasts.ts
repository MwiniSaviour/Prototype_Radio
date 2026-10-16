/**
 * Fictional demo data for UI prototyping. Episode titles, descriptions, dates
 * and durations are invented. "Radio Waa" is a real broadcaster (92.1 FM, Wa,
 * Upper West Region, Ghana — see docs/mock-data-report.md); the podcast
 * back-catalogue below is NOT the station's real catalogue.
 *
 * Cover art is generated placeholder art (see docs/assets-provenance.md).
 * Every episode's showId is resolved through the guard below, so a typo fails
 * at module load rather than rendering an orphaned episode.
 */

import type { PodcastEpisode } from "@/lib/types";
import { getShowById } from "./shows";

/** Resolve a showId to a show that actually exists. */
function parentShow(showId: string): string {
  if (!getShowById(showId)) {
    throw new Error(`podcasts.ts: unknown showId "${showId}"`);
  }
  return showId;
}

export const podcastEpisodes: PodcastEpisode[] = [
  {
    id: "ep-wa-files-12",
    slug: "the-wa-files-ep12-the-water-ledger",
    title: "Ep12 — The water ledger",
    description:
      "Four days without pressure in three districts. We read the district assembly's own repair ledgers against the outage notices residents actually received.",
    showId: parentShow("show-the-long-listen"),
    season: 3,
    episodeNumber: 12,
    publishedAt: "2026-10-12T09:00:00.000Z",
    durationSeconds: 3180,
    image: {
      src: "/assets/images/podcast-wa-files.svg",
      alt: "The Wa Files podcast art: pale waveform bars inside a circle on a red ground",
    },
    tags: ["investigations", "water", "district assembly"],
  },
  {
    id: "ep-wa-files-11",
    slug: "the-wa-files-ep11-what-the-shea-belt-burns",
    title: "Ep11 — What the shea belt burns",
    description:
      "Bushfire scars, parkland boundaries and the collectors who watch both. A season of satellite pictures, walked on foot.",
    showId: parentShow("show-the-long-listen"),
    season: 3,
    episodeNumber: 11,
    publishedAt: "2026-10-05T09:00:00.000Z",
    durationSeconds: 2760,
    image: {
      src: "/assets/images/podcast-wa-files.svg",
      alt: "The Wa Files podcast art: pale waveform bars inside a circle on a red ground",
    },
    tags: ["investigations", "agriculture", "environment"],
  },
  {
    id: "ep-straight-talk-31",
    slug: "straight-talk-ep31-what-the-caucus-saw-on-the-wa-tumu-road",
    title: "Ep31 — What the caucus saw on the Wa–Tumu road",
    description:
      "Two days of roadside inspection, one parliamentary caucus and the contractor's written answer. Read against the works.",
    showId: parentShow("show-the-wa-report"),
    season: 4,
    episodeNumber: 31,
    publishedAt: "2026-10-11T08:30:00.000Z",
    durationSeconds: 1980,
    image: {
      src: "/assets/images/podcast-straight-talk.svg",
      alt: "Straight Talk podcast art: pale chevrons above a vertical rule on a red ground",
    },
    tags: ["politics", "roads", "accountability"],
  },
  {
    id: "ep-straight-talk-30",
    slug: "straight-talk-ep30-the-endowment-fund-and-the-quiet-money",
    title: "Ep30 — The endowment fund and the quiet money",
    description:
      "How a regional educational endowment fund raised and disbursed over a quarter of a million cedis in a year, and who sits on the committee.",
    showId: parentShow("show-the-wa-report"),
    season: 4,
    episodeNumber: 30,
    publishedAt: "2026-10-04T08:30:00.000Z",
    durationSeconds: 1740,
    image: {
      src: "/assets/images/podcast-straight-talk.svg",
      alt: "Straight Talk podcast art: pale chevrons above a vertical rule on a red ground",
    },
    tags: ["politics", "education", "finance"],
  },
  {
    id: "ep-after-hours-24",
    slug: "after-hours-ep24-the-studio-behind-the-market",
    title: "Ep24 — The studio behind the market",
    description:
      "Two rooms, one microphone and a queue outside. How the region's hip-hop scene taught itself to record without leaving town.",
    showId: parentShow("show-hottest-mic"),
    season: 2,
    episodeNumber: 24,
    publishedAt: "2026-10-09T21:00:00.000Z",
    durationSeconds: 2520,
    image: {
      src: "/assets/images/podcast-after-hours.svg",
      alt: "After Hours podcast art: a dark vinyl record with a red label and a gold marker on a red ground",
    },
    tags: ["music", "studios", "youth culture"],
  },
  {
    id: "ep-after-hours-23",
    slug: "after-hours-ep23-dumba-in-the-dry-season",
    title: "Ep23 — Dumba in the dry season",
    description:
      "The festival desk on what a Wala state festival costs to stage, who pays, and why the programme keeps getting longer.",
    showId: parentShow("show-hottest-mic"),
    season: 2,
    episodeNumber: 23,
    publishedAt: "2026-10-02T21:00:00.000Z",
    durationSeconds: 2280,
    image: {
      src: "/assets/images/podcast-after-hours.svg",
      alt: "After Hours podcast art: a dark vinyl record with a red label and a gold marker on a red ground",
    },
    tags: ["festivals", "culture", "music"],
  },
  {
    id: "ep-long-listen-18",
    slug: "the-long-listen-ep18-the-transmitter-keeper",
    title: "Ep18 — The transmitter keeper",
    description:
      "For thirty-one years one engineer has climbed the same mast every Monday. This month he hands over the keys.",
    showId: parentShow("show-the-long-listen"),
    season: 2,
    episodeNumber: 18,
    publishedAt: "2026-10-11T11:00:00.000Z",
    durationSeconds: 4380,
    image: {
      src: "/assets/images/podcast-long-listen.svg",
      alt: "The Long Listen podcast art: four gold bars of decreasing height on a red ground",
    },
    tags: ["documentary", "engineering"],
  },
  {
    id: "ep-long-listen-17",
    slug: "the-long-listen-ep17-the-clinic-that-opened-at-dawn",
    title: "Ep17 — The clinic that opened at dawn",
    description:
      "An outreach post on the border road, one nurse, and a queue that forms before the generator starts.",
    showId: parentShow("show-the-long-listen"),
    season: 2,
    episodeNumber: 17,
    publishedAt: "2026-10-04T11:00:00.000Z",
    durationSeconds: 3900,
    image: {
      src: "/assets/images/podcast-long-listen.svg",
      alt: "The Long Listen podcast art: four gold bars of decreasing height on a red ground",
    },
    tags: ["documentary", "health"],
  },
  {
    id: "ep-business-brief-52",
    slug: "business-brief-ep52-agents-before-atms",
    title: "Ep52 — Agents before ATMs",
    description:
      "Fifteen minutes on why the mobile money agent, not the machine, is the region's cash infrastructure — and what happens when the agent closes.",
    showId: parentShow("show-market-square"),
    season: 5,
    episodeNumber: 52,
    publishedAt: "2026-10-14T07:00:00.000Z",
    durationSeconds: 900,
    image: {
      src: "/assets/images/podcast-business-brief.svg",
      alt: "Business Brief podcast art: a rising dark trend line with an arrow head on a red ground",
    },
    tags: ["business", "mobile money", "connectivity"],
  },
  {
    id: "ep-business-brief-51",
    slug: "business-brief-ep51-the-price-of-a-bag-of-groundnut",
    title: "Ep51 — The price of a bag of groundnut",
    description:
      "One bag, five markets, four months. What the grower gets and what the exporter books.",
    showId: parentShow("show-market-square"),
    season: 5,
    episodeNumber: 51,
    publishedAt: "2026-10-07T07:00:00.000Z",
    durationSeconds: 900,
    image: {
      src: "/assets/images/podcast-business-brief.svg",
      alt: "Business Brief podcast art: a rising dark trend line with an arrow head on a red ground",
    },
    tags: ["business", "agriculture", "trade"],
  },
  {
    id: "ep-business-brief-50",
    slug: "business-brief-ep50-sensors-in-the-shea-belt",
    title: "Ep50 — Sensors in the shea belt",
    description:
      "The students wiring soil and moisture sensors onto shea trees, and what their data is actually worth to a collector.",
    showId: parentShow("show-market-square"),
    season: 5,
    episodeNumber: 50,
    publishedAt: "2026-09-30T07:00:00.000Z",
    durationSeconds: 900,
    image: {
      src: "/assets/images/podcast-business-brief.svg",
      alt: "Business Brief podcast art: a rising dark trend line with an arrow head on a red ground",
    },
    tags: ["technology", "agriculture", "startups"],
  },
  {
    id: "ep-open-line-44",
    slug: "open-line-ep44-the-dedication-that-took-nine-years",
    title: "Ep44 — The dedication that took nine years",
    description:
      "One listener's request, broadcast from abroad, answered by a relative two districts away. The call, unedited.",
    showId: parentShow("show-open-line"),
    season: 1,
    episodeNumber: 44,
    publishedAt: "2026-10-06T21:00:00.000Z",
    durationSeconds: 5220,
    image: {
      src: "/assets/images/podcast-after-hours.svg",
      alt: "After Hours podcast art: a dark vinyl record with a red label and a gold marker on a red ground",
    },
    tags: ["community", "diaspora", "dedications"],
  },
];

const byRecency = (a: PodcastEpisode, b: PodcastEpisode) =>
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

export function getEpisodeBySlug(slug: string): PodcastEpisode | undefined {
  return podcastEpisodes.find((episode) => episode.slug === slug);
}

export function getEpisodesByShow(showId: string): PodcastEpisode[] {
  return podcastEpisodes.filter((episode) => episode.showId === showId).sort(byRecency);
}

export function getLatestEpisodes(limit = 4): PodcastEpisode[] {
  return [...podcastEpisodes].sort(byRecency).slice(0, limit);
}
