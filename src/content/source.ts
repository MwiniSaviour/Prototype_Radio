/**
 * Which backend serves the site's content. `local` reads the seed fixtures in
 * src/data; `payload` reads the Postgres-backed Payload Local API via
 * src/content/payload.ts. Both implementations are wired up in ./index.
 */
export type ContentSource = "local" | "payload";

function resolveContentSource(): ContentSource {
  const raw = process.env.CONTENT_SOURCE?.trim();
  if (!raw || raw === "local") return "local";
  if (raw === "payload") return "payload";

  throw new Error(
    `CONTENT_SOURCE="${raw}" is not a recognised content source. Valid values: "local" (default), "payload".`,
  );
}

/** The active content backend, resolved once at module load. */
export const contentSource: ContentSource = resolveContentSource();
