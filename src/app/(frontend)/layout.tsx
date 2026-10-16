import type { Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SkipLink } from "@/components/layout/SkipLink";
import { SiteHeader } from "@/components/layout/Header";
import { SiteFooter } from "@/components/layout/Footer";
import { getCategories, getCurrentShow, getNextShow } from "@/content";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata = buildMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.themeColors.light },
    { media: "(prefers-color-scheme: dark)", color: siteConfig.themeColors.dark },
  ],
  colorScheme: "dark light",
};

// Routes are statically generated; hourly regeneration keeps the on-air strip
// and relative timestamps honest without a server round-trip.
export const revalidate = 3600;

/*
 * Applies the persisted theme before first paint so there is no flash of the
 * wrong colour scheme. Must stay inline and self-contained (no imports) — it
 * runs before React hydrates. The storage key matches siteConfig.themeStorageKey.
 */
const themeScript = `(function(){try{var k=${JSON.stringify(siteConfig.themeStorageKey)};var s=localStorage.getItem(k);var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The header is a client component, so the on-air state and menu categories
  // are resolved here and passed down rather than bundled from the fixtures.
  const [currentShow, nextShow, categories] = await Promise.all([
    getCurrentShow(),
    getNextShow(),
    getCategories(),
  ]);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <SkipLink />
        <SiteHeader currentShow={currentShow} nextShow={nextShow} categories={categories} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
