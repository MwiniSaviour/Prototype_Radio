/**
 * Radio Waa / Prototype Radio — Next.js configuration.
 *
 * Platform notes
 * --------------
 * Termux / Android / bionic libc: the native SWC binding cannot dlopen glibc's
 * libdl.so.2, so local builds run on the WASM SWC binding
 * (@next/swc-wasm-nodejs). Turbopack has no WASM fallback and is blocked on
 * android/arm64 — every local `next dev` / `next build` must pass `--webpack`.
 * The same flag is used on Vercel so both paths take the identical code path
 * (the Payload resolver alias below is a webpack feature).
 *
 * Vercel: linux/glibc, so the native `sharp` prebuild works and the
 * /_next/image optimizer is switched back on (it is off on Termux, which has no
 * usable sharp). See docs/deployment.md.
 */
import { withPayload } from "@payloadcms/next/withPayload";

/**
 * Vercel sets VERCEL=1 in every build/runtime. Keep this the single switch that
 * changes platform behaviour, so a local production build matches what ships.
 */
const isVercel = Boolean(process.env.VERCEL);

/**
 * Image optimization needs a working native sharp. On Vercel it is available;
 * on Termux the resolved sharp is the WASM build, which the optimizer cannot
 * use. NEXT_IMAGE_OPTIMIZATION=on|off overrides the guess either way.
 */
const imageOptimization = process.env.NEXT_IMAGE_OPTIMIZATION
  ? process.env.NEXT_IMAGE_OPTIMIZATION === "on"
  : isVercel;

/**
 * Baseline security headers. These are applied by Next itself (not only by the
 * Vercel edge) so `next start` behind any proxy behaves the same.
 *
 * No Content-Security-Policy yet: Next's inline bootstrap scripts and Payload's
 * admin bundle need a nonce/hash pipeline first, and a half-applied policy that
 * silently breaks the player is worse than none. docs/deployment.md tracks it.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The station plays audio; it never records. Deny the sensors the site has no
  // use for so an injected third party cannot reach them either.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Vercel terminates TLS for every deployment, so this is safe to assert.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Do not advertise the framework version to the internet.
  poweredByHeader: false,

  // The dev-mode badge sits over the player bar in previews; the console is the
  // place to read build state.
  devIndicators: false,

  /*
   * The dev server is reached through the sandbox's preview proxy, so its Host
   * header is not localhost. Next 16 rejects cross-origin dev requests unless
   * the origin is listed here — without this the preview loads HTML but every
   * /_next asset is blocked. Dev-only; production ignores it.
   */
  allowedDevOrigins: [
    "*.e2b.app",
    "*.arena.ai",
    "*.usercontent.goog",
    "localhost",
    "127.0.0.1",
  ],

  images: {
    // On by Vercel's native sharp; off on Termux (WASM sharp only). See above.
    unoptimized: !imageOptimization,
    formats: ["image/avif", "image/webp"],
    // Every image ships from public/assets/images via next/image with a local
    // path, so no remote host needs to be allowed.
    remotePatterns: [],
  },

  // Lint/typecheck run as separate scripts (eslint.config.mjs / tsc); Next 16
  // no longer accepts eslint config here.
  typescript: { ignoreBuildErrors: false },

  /*
   * Android's low-memory killer killed the session during the first
   * CONTENT_SOURCE=payload build. Next otherwise sizes its static-generation
   * worker pool from os.cpus() (8 here); each worker carries a large heap, so cap
   * the pool to keep peak RSS inside the ~2 GB budget on this device. Vercel
   * builds want the default (their builders are sized for it).
   */
  experimental: isVercel
    ? {}
    : {
        cpus: 2,
        staticGenerationMaxConcurrency: 2,
      },

  async headers() {
    const headers = [
      { source: "/:path*", headers: securityHeaders },
      {
        /*
         * Photography is the heaviest thing on the page and never changes under
         * a given filename. A day of edge caching with a week of
         * stale-while-revalidate keeps replacements (which we do ship) visible
         * without re-fetching on every view.
         */
        source: "/assets/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];

    /*
     * Preview deployments are real, reachable URLs on a shared domain. Keep them
     * out of search results; production keeps its normal indexing.
     */
    if (process.env.VERCEL_ENV === "preview") {
      headers.push({
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      });
    }

    return headers;
  },

  /*
   * Payload's TypeScript sources import sibling modules by their compiled
   * extension (".js" referring to a ".ts" file); extensionAlias teaches the
   * webpack resolver that mapping. Required by the official Payload/Next
   * integration template — and the reason builds stay on webpack rather than
   * Turbopack.
   */
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };

    return webpackConfig;
  },
};

// devBundleServerPackages: false keeps `payload` / `@payloadcms/db-postgres`
// external in dev — fewer modules to compile and much less RAM on this host
// (same option the official Payload template sets).
export default withPayload(nextConfig, { devBundleServerPackages: false });
