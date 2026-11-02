import path from "path";
import { fileURLToPath } from "url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Articles } from "./collections/Articles";
import { Authors } from "./collections/Authors";
import { Categories } from "./collections/Categories";
import { Events } from "./collections/Events";
import { Listeners } from "./collections/Listeners";
import { Media } from "./collections/Media";
import { PodcastEpisodes } from "./collections/PodcastEpisodes";
import { Shows } from "./collections/Shows";
import { Stations } from "./collections/Stations";
import { Tickets } from "./collections/Tickets";
import { Users } from "./collections/Users";
import { SiteSettings } from "./globals/SiteSettings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * Public origin of this deployment. The admin bundle, CORS and absolute URLs are
 * built from it, so it must be the origin the browser is actually on:
 *
 * 1. NEXT_PUBLIC_SITE_URL — the explicit production domain (preferred, and what
 *    the front end uses for canonical URLs).
 * 2. VERCEL_URL — the per-deployment host, so a preview's admin works on the
 *    preview's own origin instead of posting to production.
 * 3. VERCEL_PROJECT_PRODUCTION_URL — the project's stable production alias.
 * 4. localhost, for `next dev`.
 */
function resolveServerURL(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production}`;

  return "http://localhost:3000";
}

const serverURL = resolveServerURL();

/**
 * Vercel's filesystem is read-only and per-invocation, so uploads cannot live in
 * `public/media` there. When a Blob token is present the storage plugin takes
 * over every media upload (and sets `disableLocalStorage` itself); without one —
 * local development, the Termux preview — the collection keeps writing to disk.
 */
const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();

/**
 * No `editor` is set on purpose: this project has no richtext fields (article
 * bodies are the four-block `body` field) and @payloadcms/richtext-lexical is
 * deliberately not installed on this host.
 */
export default buildConfig({
  admin: {
    user: Users.slug,
    // The admin app lives under src/app/(payload), not the repo root.
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Categories,
    Authors,
    Articles,
    Shows,
    PodcastEpisodes,
    // Prototype Radio (mobile): the station, ticketed events and the listener's
    // wallet + account, all seeded from the same fixtures the website uses.
    Stations,
    Events,
    Tickets,
    Listeners,
  ],
  globals: [SiteSettings],
  plugins: blobToken
    ? [
        vercelBlobStorage({
          enabled: true,
          collections: { media: true },
          token: blobToken,
        }),
      ]
    : [],
  db: postgresAdapter({
    pool: {
      // .env carries the Termux-local trust-auth URL; the fallback is the same
      // instance so CLI tooling works even without a loaded environment. On
      // Vercel this is the Neon connection string — use the POOLED host
      // (`...-pooler...`) so concurrent lambdas share a small set of server
      // connections instead of each opening its own.
      connectionString: process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:5432/radiowaa",
      // Every serverless instance keeps its own pool, so the per-instance cap
      // has to stay low: 3 × N instances, not 10 × N.
      max: Number(process.env.DATABASE_POOL_MAX ?? (process.env.VERCEL ? 3 : 10)),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    },
  }),
  // Passed explicitly rather than auto-detected: this host has no bionic sharp
  // prebuild, so the resolved `sharp` is the WASM build (@img/sharp-wasm32).
  // Payload's own detection does not see it and silently disables image resizing.
  sharp,
  // Payload refuses to boot without a signing secret; .env supplies PAYLOAD_SECRET.
  secret: process.env.PAYLOAD_SECRET ?? "",
  serverURL,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
