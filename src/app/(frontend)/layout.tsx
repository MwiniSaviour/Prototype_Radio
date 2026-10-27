import type { Viewport } from "next";
import { SkipLink } from "@/components/layout/SkipLink";
import { SiteHeader } from "@/components/layout/Header";
import { SiteFooter } from "@/components/layout/Footer";
import { PlayerBar } from "@/components/layout/PlayerBar";
import { getCategories, getCurrentShow, getNextShow } from "@/content";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/constants";
import "./globals.css";

export const metadata = buildMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.themeColors.light },
    { media: "(prefers-color-scheme: dark)", color: siteConfig.themeColors.dark },
  ],
  /**
   * The site is light-first: light is the declared scheme, and dark is only
   * applied when a reader opts in with the footer toggle (the `.dark` class).
   */
  colorScheme: "light",
};

// Routes are statically generated; hourly regeneration keeps the on-air strip
// and relative timestamps honest without a server round-trip.
export const revalidate = 3600;

/*
 * Applies the persisted theme before first paint so there is no flash of the
 * wrong colour scheme. Must stay inline and self-contained (no imports) — it
 * runs before React hydrates. The storage key matches siteConfig.themeStorageKey.
 *
 * Light is the default: the OS preference is deliberately NOT consulted, so a
 * reader whose machine is set to dark still lands on the warm-paper edition.
 * Only an explicit choice (the footer toggle) turns dark on.
 */
const themeScript = `(function(){try{var k=${JSON.stringify(siteConfig.themeStorageKey)};var v=localStorage.getItem(k);document.documentElement.classList.toggle("dark",v==="dark");}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The header is a client component, so the on-air state and menu categories
  // are resolved here and passed down rather than bundled from the fixtures.
  const [currentShow, nextShow, categories] = await Promise.all([
    getCurrentShow(),
    getNextShow(),
    getCategories(),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col pb-[62px]">
        <SkipLink />
        <SiteHeader currentShow={currentShow} nextShow={nextShow} categories={categories} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        {/* One player for the whole site: the strip is fixed, so nothing scrolls it away. */}
        <PlayerBar currentShow={currentShow} nextShow={nextShow} />
      </body>
    </html>
  );
}
