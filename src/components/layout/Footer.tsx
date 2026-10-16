import Link from "next/link";
import { siteConfig } from "@/lib/constants";
import { getCategories } from "@/content";
import { Container } from "../ui/Container";
import { Divider } from "../ui/Divider";
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

export async function SiteFooter() {
  const year = new Date().getFullYear();
  const topCategories = (await getCategories()).slice(0, 5);

  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              {siteConfig.tagline} An independent newsroom, on air and on the record.
            </p>
            <ul className="mt-4 flex items-center gap-1">
              {siteConfig.socials.map((social) => {
                const Icon = socialIcons[social.label];
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink focus-visible:focus-ring"
                      {...(social.href.startsWith("http")
                        ? { target: "_blank", rel: "noreferrer noopener" }
                        : {})}
                    >
                      <span className="sr-only">{social.label}</span>
                      {Icon ? <Icon className="h-5 w-5" /> : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {siteConfig.footerNav.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                {group.title}
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-sm text-sm text-ink hover:text-brand hover:underline focus-visible:focus-ring"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav aria-label="Categories">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Categories
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {topCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="rounded-sm text-sm text-ink hover:text-brand hover:underline focus-visible:focus-ring"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Divider className="my-8" />

        <div className="flex flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.legalName}. A UI/UX foundation — no tracking, no cookies.
          </p>
          <Link href="/" className="rounded-sm hover:text-ink hover:underline focus-visible:focus-ring">
            Back to top
          </Link>
        </div>
      </Container>
    </footer>
  );
}
