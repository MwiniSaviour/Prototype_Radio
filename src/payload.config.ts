import path from "path";
import { fileURLToPath } from "url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Articles } from "./collections/Articles";
import { Authors } from "./collections/Authors";
import { Categories } from "./collections/Categories";
import { Media } from "./collections/Media";
import { PodcastEpisodes } from "./collections/PodcastEpisodes";
import { Shows } from "./collections/Shows";
import { Users } from "./collections/Users";
import { SiteSettings } from "./globals/SiteSettings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

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
  collections: [Users, Media, Categories, Authors, Articles, Shows, PodcastEpisodes],
  globals: [SiteSettings],
  db: postgresAdapter({
    pool: {
      // .env carries the Termux-local trust-auth URL; the fallback is the same
      // instance so CLI tooling works even without a loaded environment.
      connectionString: process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:5432/radiowaa",
    },
  }),
  // Passed explicitly rather than auto-detected: this host has no bionic sharp
  // prebuild, so the resolved `sharp` is the WASM build (@img/sharp-wasm32).
  // Payload's own detection does not see it and silently disables image resizing.
  sharp,
  // Payload refuses to boot without a signing secret; .env supplies PAYLOAD_SECRET.
  secret: process.env.PAYLOAD_SECRET ?? "",
  serverURL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
