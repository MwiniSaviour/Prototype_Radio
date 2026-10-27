/**
 * Radio Waa — Next.js configuration.
 *
 * Platform note (Termux / Android / bionic libc): see AGENTS.md. The native SWC
 * binding cannot dlopen glibc's libdl.so.2, so builds run on the WASM SWC binding
 * (@next/swc-wasm-nodejs). Turbopack has no WASM fallback and is blocked on
 * android/arm64 — every next dev / next build must pass --webpack.
 */
import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // The dev-mode badge sits over the player bar in previews; the console is the
  // place to read build state.
  devIndicators: false,

  /*
   * The dev server is reached through the sandbox's preview proxy, so its Host
   * header is not localhost. Next 16 rejects cross-origin dev requests unless
   * the origin is listed here — without this the preview loads HTML but every
   * /_next asset is blocked.
   */
  allowedDevOrigins: [
    "*.e2b.app",
    "*.arena.ai",
    "*.usercontent.goog",
    "localhost",
    "127.0.0.1",
  ],

  images: {
    // bionic libc has no glibc sharp prebuild, so the /_next/image optimizer
    // cannot run on this platform. Re-enable optimization (drop `unoptimized`)
    // when deploying to glibc/musl infrastructure.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // Lint/typecheck run as separate scripts (eslint.config.mjs / tsc); Next 16
  // no longer accepts eslint config here.
  typescript: { ignoreBuildErrors: false },

  // Android's low-memory killer killed the session during the first
  // CONTENT_SOURCE=payload build. Next otherwise sizes its static-generation
  // worker pool from os.cpus() (8 here); each worker carries a large heap, so
  // cap the pool to keep peak RSS inside the ~2 GB budget on this device.
  experimental: {
    cpus: 2,
    staticGenerationMaxConcurrency: 2,
  },

  // Payload's TypeScript sources import sibling modules by their compiled
  // extension (".js" referring to a ".ts" file); extensionAlias teaches the
  // webpack resolver that mapping. Required by the official Payload/Next
  // integration template.
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
