import Link from "next/link";
import { siteConfig } from "@/lib/constants";
import { getCategories } from "@/content";
import { Container } from "../ui/Container";
import { ThemeToggle } from "./ThemeToggle";
import {
  IconFacebook,
  IconInstagram,
  IconRss,
  IconXSocial,
  IconYouTube,
} from "../ui/icons";
import { Wordmark } from "./Wordmark";

const socialIcons: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  X: IconXSocial,
  Facebook: IconFacebook,
  Instagram: IconInstagram,
  YouTube: IconYouTube,
  RSS: IconRss,
};

/**
 * The colophon: wordmark, positioning line and socials on the left, then the
 * section index, the listen links and the newsroom's own pages. Hairline rules
 * and small caps, matching the masthead's type.
 */
export async function SiteFooter() {
  const year = new Date().getFullYear();
  const topCategories = (await getCategories()).slice(0, 6);

  return (
    <footer className="mt-4 border-t border-line bg-surface">
      <Container className="py-10">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-[19rem] text-[12.5px] leading-[1.6] text-muted">
              {siteConfig.tagline} An independent broadcaster and newsroom in Wa, Upper West
              Region — on air and on the record.
            </p>
            <ul className="mt-4 flex items-center gap-1">
              {siteConfig.socials.map((social) => {
                const Icon = socialIcons[social.label];
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-line text-muted transition-colors duration-150 hover:border-line-strong hover:text-brand focus-visible:focus-ring"
                      {...(social.href.startsWith("http")
                        ? { target: "_blank", rel: "noreferrer noopener" }
                        : {})}
                    >
                      <span className="sr-only">{social.label}</span>
                      {Icon ? <Icon className="h-4 w-4" /> : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <nav aria-label="Sections">
            <h2 className="text-[10px] font-bold tracking-[0.16em] text-ink uppercase">Sections</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {topCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-[12.5px] text-muted transition-colors hover:text-brand focus-visible:focus-ring"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Listen">
            <h2 className="text-[10px] font-bold tracking-[0.16em] text-ink uppercase">Listen</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {[
                { label: "Live radio", href: "/shows" },
                { label: "Full schedule", href: "/shows#schedule" },
                { label: "Podcasts", href: "/podcasts" },
                { label: "Every show", href: "/shows#roster-heading" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[12.5px] text-muted transition-colors hover:text-brand focus-visible:focus-ring"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="The newsroom">
            <h2 className="text-[10px] font-bold tracking-[0.16em] text-ink uppercase">Newsroom</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {[
                { label: "About us", href: "/about" },
                { label: "Editorial standards", href: "/about#editorial-standards" },
                { label: "Contact", href: "/about#reach-the-newsroom" },
                { label: "Search the archive", href: "/search" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[12.5px] text-muted transition-colors hover:text-brand focus-visible:focus-ring"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-line pt-4 text-[11px] text-muted-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.legalName}. A UI/UX foundation — no tracking, no cookies.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              Appearance
              <ThemeToggle />
            </span>
            <Link href="/" className="transition-colors hover:text-ink">
              Back to top
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
