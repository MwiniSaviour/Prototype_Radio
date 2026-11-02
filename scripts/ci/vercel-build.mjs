#!/usr/bin/env node
/**
 * Vercel build entry point (`npm run vercel-build`).
 *
 * Order matters, and it is the order the platform expects:
 *
 *   1. Validate the environment *before* spending minutes on a build that would
 *      otherwise fail halfway through static generation with a Postgres timeout.
 *   2. Apply pending Payload migrations, so the database schema matches the code
 *      that is about to be deployed. Skipped for the `local` content source (no
 *      database involved) and when PAYLOAD_SKIP_MIGRATE=1.
 *   3. Build with the same flags used locally (`--webpack`), so the Payload
 *      resolver alias in next.config.mjs applies and the two paths cannot drift.
 *
 * Migrations are safe to run here: Vercel serialises deployments of a project,
 * so two builds never migrate the same database concurrently. If you would
 * rather migrate out-of-band (e.g. from CI before promotion), set
 * PAYLOAD_SKIP_MIGRATE=1 and run `npm run migrate` yourself.
 */
import { spawn } from "node:child_process";
import process from "node:process";

import {
  assertDatabaseUrl,
  assertPayloadSecret,
  contentSource,
  reportBanner,
} from "./env.mjs";

function run(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ...extraEnv },
      // `npx`/local binaries resolve from here on every platform we build on.
      shell: process.platform === "win32",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) return resolve();
      reject(new Error(`${command} ${args.join(" ")} exited with ${signal ?? code}`));
    });
  });
}

async function main() {
  const source = contentSource();
  reportBanner({ source });

  if (source === "payload") {
    // Both are hard requirements as soon as Payload is the backend: the build
    // itself queries Postgres to prerender pages, and the admin refuses to boot
    // without a signing secret.
    assertDatabaseUrl();
    assertPayloadSecret();

    if (process.env.PAYLOAD_SKIP_MIGRATE === "1") {
      console.log("▸ Skipping migrations (PAYLOAD_SKIP_MIGRATE=1)\n");
    } else {
      console.log("▸ Applying Payload migrations\n");
      await run(process.execPath, ["scripts/ci/migrate.mjs"]);
    }
  } else {
    console.log(
      "▸ CONTENT_SOURCE=local — building from the seeded fixtures. The CMS and\n" +
        "  admin routes still need DATABASE_URL to be reachable at runtime.\n",
    );
  }

  console.log("▸ next build --webpack\n");
  await run(process.execPath, ["node_modules/next/dist/bin/next", "build", "--webpack"]);
}

main().catch((error) => {
  console.error(`\n${error.message}\n`);
  process.exitCode = 1;
});
