/**
 * Fictional demo data for UI prototyping — the stations listed in the Pulse
 * Radio mobile mock. Frequencies, cities and taglines are invented for the
 * prototype; the station artwork is generated placeholder art (see
 * docs/assets-provenance.md). Streams ship empty on purpose: a real broadcaster
 * feed needs licensing sorted first (docs/live-audio-backend-research.md).
 *
 * This module is the single source of truth for both the Payload seed
 * (scripts/seed.ts) and the mobile app's offline fallback, mirroring the
 * convention used by src/data/shows.ts.
 */

import type { Station } from "@/lib/types";

export const stations: Station[] = [
  {
    id: "station-pulse-102-5",
    slug: "pulse-102-5",
    name: "Pulse 102.5 FM",
    frequency: "102.5 FM",
    city: "Accra",
    tagline: "The Voice of Accra",
    artwork: {
      src: "/assets/images/pulse-station-pulse-102-5.jpg",
      alt: "Pulse 102.5 FM station artwork: the orange Pulse waveform on a black ground",
    },
    // The seed and the app both read a station stream from the environment at
    // their own boundary (Next: NEXT_PUBLIC_STREAM_URL, Vite: VITE_STREAM_URL),
    // so this shared fixture stays framework-agnostic.
    streamUrl: "",
    flagship: true,
    live: true,
  },
  {
    id: "station-urban-radio",
    slug: "urban-radio",
    name: "Urban Radio",
    frequency: "98.1 FM",
    city: "Accra",
    tagline: "The city, all day",
    artwork: {
      src: "/assets/images/pulse-station-urban-radio.jpg",
      alt: "Urban Radio 98.1 FM station artwork: white wordmark on a violet night skyline",
    },
    streamUrl: "",
    live: true,
  },
  {
    id: "station-highlife-classics",
    slug: "highlife-classics",
    name: "Highlife Classics",
    frequency: "98.7 FM",
    city: "Accra",
    tagline: "The golden years, remastered",
    artwork: {
      src: "/assets/images/pulse-station-highlife.jpg",
      alt: "Highlife Classics 98.7 FM station artwork: cream serif type on deep green leaves",
    },
    streamUrl: "",
    live: true,
  },
  {
    id: "station-afrobeats-vibes",
    slug: "afrobeats-vibes",
    name: "Afrobeats Vibes",
    frequency: "104.3 FM",
    city: "Accra",
    tagline: "Afrobeats, amapiano and everything after",
    artwork: {
      src: "/assets/images/pulse-event-afrobeats-zone.jpg",
      alt: "Afrobeats Vibes 104.3 FM station artwork: warm stage light over a dancing crowd",
    },
    streamUrl: "",
    live: true,
  },
];

const stationsBySlug = new Map(stations.map((station) => [station.slug, station]));

export function getStationBySlug(slug: string): Station | undefined {
  return stationsBySlug.get(slug);
}

/** The station the app boots into — Pulse 102.5 FM in the design. */
export const flagshipStation: Station =
  stations.find((station) => station.flagship) ?? stations[0];
