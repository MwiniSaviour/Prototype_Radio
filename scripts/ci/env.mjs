/**
 * Shared environment checks for the deployment scripts.
 *
 * Every failure here is written for whoever reads the Vercel build log at 2am:
 * what is wrong, which variable fixes it, and where to set it. Never print a
 * secret — only whether it is present and whether it looks structurally right.
 */

/** Matches what Payload requires: a signing secret, not a passphrase. */
const HEX_64 = /^[0-9a-f]{64}$/i;

export const isVercel = Boolean(process.env.VERCEL);

/** The content backend the site will read at request time. */
export function contentSource() {
  const raw = process.env.CONTENT_SOURCE?.trim();
  if (!raw) return "local";
  if (raw === "local" || raw === "payload") return raw;
  fail(
    `CONTENT_SOURCE="${raw}" is not valid.`,
    'Use "payload" (Postgres through the Payload CMS) or "local" (the seeded fixtures in src/data).',
  );
}

export function requireEnv(name, hint) {
  const value = process.env[name]?.trim();
  if (!value) {
    fail(`Missing required environment variable ${name}.`, hint);
  }
  return value;
}

/**
 * Payload validates the secret length itself at runtime, but only after the
 * function is already serving traffic. Catching it at build time turns a
 * runtime 500 into a failed deployment with an actionable message.
 */
export function assertPayloadSecret() {
  const secret = requireEnv(
    "PAYLOAD_SECRET",
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
  );

  if (!HEX_64.test(secret)) {
    fail(
      "PAYLOAD_SECRET is not 64 hex characters.",
      'Payload signs cookies and tokens with it; regenerate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))". Rotating it invalidates existing admin sessions.',
    );
  }
}

/**
 * The database URL must reach Postgres from the build machine (static pages are
 * generated at build time) *and* from the functions. On Vercel that means the
 * pooled connection string from Neon/Supabase/Vercel Postgres.
 */
export function assertDatabaseUrl() {
  const url = requireEnv(
    "DATABASE_URL",
    "Set it to the POOLED Postgres connection string (Neon: the host containing `-pooler`), with `?sslmode=require` for hosted providers.",
  );

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    fail("DATABASE_URL is not a valid URL.", "Expected postgres://user:password@host/database?sslmode=require");
  }

  if (!/^postgres(ql)?:$/.test(parsed.protocol)) {
    fail(`DATABASE_URL uses the unsupported protocol "${parsed.protocol}".`, "It must start with postgres:// or postgresql://");
  }

  // A localhost database in a Vercel build can never work: the builder is a
  // different machine from any database you run yourself.
  if (isVercel && ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) {
    fail(
      "DATABASE_URL points at localhost, which does not exist inside a Vercel build.",
      "Point it at a hosted Postgres (Neon is the cheapest fit for this app) and redeploy.",
    );
  }

  return url;
}

/** Prints a build banner with no secrets in it. */
export function reportBanner({ source }) {
  const lines = [
    `content source : ${source}`,
    `environment    : ${process.env.VERCEL_ENV ?? "local"}`,
    `node           : ${process.version}`,
    `database       : ${process.env.DATABASE_URL ? "configured" : "not configured"}`,
    `payload secret : ${process.env.PAYLOAD_SECRET ? "configured" : "not configured"}`,
    `media storage  : ${process.env.BLOB_READ_WRITE_TOKEN ? "vercel blob" : "local disk (public/media)"}`,
  ];

  console.log(`\n▸ Prototype Radio build\n  ${lines.join("\n  ")}\n`);
}

/** Throws with a formatted, multi-line explanation. */
export function fail(headline, hint) {
  const message = [`✖ ${headline}`, hint ? `  ${hint}` : null, "  Docs: docs/deployment.md"].filter(Boolean).join("\n");
  throw new Error(message);
}
