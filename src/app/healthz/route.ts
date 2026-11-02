import { contentSource, getCategories } from "@/content";

/**
 * Liveness/readiness probe for the deployment (`GET /healthz`).
 *
 * Deliberately outside `/api`: Payload owns `/api/*` through its catch-all REST
 * route, and a health endpoint that shadows a CMS collection name would be a
 * trap later.
 *
 * Vercel's own health checks only prove the function booted. This route also
 * exercises the content layer once, so a database that is unreachable — the most
 * likely production failure after a password rotation or a paused Neon branch —
 * is reported instead of silently serving a half-rendered page.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startedAt = Date.now();

  const base = {
    source: contentSource,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    region: process.env.VERCEL_REGION ?? null,
    environment: process.env.VERCEL_ENV ?? "local",
  };

  try {
    // Only the Payload backend has anything to prove; the fixture backend is
    // in-process memory and cannot be "unreachable".
    if (contentSource === "payload") {
      await getCategories();
    }

    return Response.json(
      { status: "ok", ...base, latencyMs: Date.now() - startedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    // Full detail to the server log, generic body to the caller: the response is
    // public, and a stack trace can name the database host and user.
    console.error("[healthz] content check failed", error);

    return Response.json(
      {
        status: "degraded",
        ...base,
        latencyMs: Date.now() - startedAt,
        error: "Content backend unavailable.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
