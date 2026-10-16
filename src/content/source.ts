/**
 * Which backend serves the site's content. `local` reads the seed fixtures in
 * src/data; `payload` will read the Postgres-backed Payload Local API once that
 * implementation lands.
 */
export type ContentSource = "local" | "payload";

function resolveContentSource(): ContentSource {
  const raw = process.env.CONTENT_SOURCE?.trim();
  if (!raw || raw === "local") return "local";

  if (raw === "payload") {
    throw new Error(
      'CONTENT_SOURCE="payload" is selected but the Payload content backend is not implemented yet. ' +
        'Unset CONTENT_SOURCE (or set it to "local") to serve the src/data seed fixtures.',
    );
  }

  throw new Error(
    `CONTENT_SOURCE="${raw}" is not a recognised content source. Valid values: "local" (default), "payload".`,
  );
}

/** The active content backend, resolved once at module load. */
export const contentSource: ContentSource = resolveContentSource();
