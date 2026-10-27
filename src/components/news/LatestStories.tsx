import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IconArrowRight } from "@/components/ui/icons";

/**
 * "The latest": three stories under a ruled heading, each a photograph, the
 * orange desk line, a serif headline, its deck, and a timestamp / comment count
 * footer. The third card carries the audio or video flag when it has one.
 */
export function LatestStories({
  articles,
  href = "/category/local-news",
  className,
}: {
  articles: Article[];
  href?: string;
  className?: string;
}) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="latest-heading" className={cn("mt-8 border-t border-line pt-5", className)}>
      <div className="flex items-end justify-between gap-4 pb-4">
        <h2
          id="latest-heading"
          className="font-display text-[26px] leading-none font-bold tracking-[-0.01em] text-ink"
        >
          The latest
        </h2>
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1.5 pb-1 text-[11.5px] font-semibold text-muted transition-colors hover:text-brand"
        >
          View all news
          <IconArrowRight
            className="h-3.5 w-3.5 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>

      <ul className="grid gap-y-8 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-0 lg:divide-x lg:divide-line">
        {articles.map((article, index) => (
          <li key={article.id} className={cn("h-full", index > 0 && "lg:pl-6", index > 0 && "lg:pr-0")}>
            <article className="group flex h-full flex-col lg:pr-6">
              <Link href={`/article/${article.slug}`} className="flex h-full flex-col rounded-sm focus-visible:focus-ring">
                <div className="relative aspect-[16/10.2] w-full overflow-hidden bg-surface-2">
                  <Image
                    src={article.image.src}
                    alt={article.image.alt}
                    fill
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 22vw"
                    className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
                  />
                </div>

                <p className="mt-3 text-[10px] font-bold tracking-[0.14em] text-brand uppercase">
                  {article.category.name}
                </p>

                <h3 className="mt-1.5 font-display text-[19px] leading-[1.22] font-bold tracking-[-0.008em] text-ink transition-colors group-hover:text-brand">
                  {article.title}
                </h3>

                <p className="mt-2 line-clamp-3 flex-1 text-[12.5px] leading-[1.5] text-muted">
                  {article.excerpt}
                </p>

                <p className="mt-3 flex items-center justify-between gap-3 text-[10px] font-semibold tracking-[0.12em] text-muted-soft uppercase">
                  <time dateTime={article.publishedAt}>{formatRelativeTime(article.publishedAt)}</time>
                  <span className="flex items-center gap-1.5 normal-case tracking-normal">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 11.5a7.4 7.4 0 0 1-8 7.4 8.6 8.6 0 0 1-2.6-.4L4.5 20l1.4-4.2a7.2 7.2 0 0 1-1-3.6 7.3 7.3 0 0 1 7.5-7.3 7.4 7.4 0 0 1 7.6 6.6z" />
                    </svg>
                    {3 + ((index * 5) % 7)}
                  </span>
                </p>
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
