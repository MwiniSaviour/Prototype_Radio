import Link from "next/link";
import type { Article } from "@/lib/types";

export interface BreakingNewsTickerProps {
  articles: Article[];
}

/**
 * Breaking-news bar. The marquee is pure CSS (no JS), pauses on hover/focus,
 * and falls back to a static scrollable list under prefers-reduced-motion.
 * The second track is aria-hidden so assistive tech hears each item once.
 */
export function BreakingNewsTicker({ articles }: BreakingNewsTickerProps) {
  if (articles.length === 0) return null;

  const track = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      className="flex w-max items-center gap-8 pr-8 motion-safe:animate-marquee motion-safe:group-hover:[animation-play-state:paused] motion-safe:group-focus-within:[animation-play-state:paused]"
    >
      {articles.map((article) => (
        <li key={article.id} className="flex items-center gap-8 whitespace-nowrap">
          <Link
            href={`/article/${article.slug}`}
            className="rounded-sm text-sm font-medium text-ink underline-offset-4 hover:underline focus-visible:focus-ring"
          >
            {article.title}
          </Link>
          <span aria-hidden="true" className="text-brand">
            •
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section
      aria-label="Breaking news"
      className="group border-b border-line bg-brand-soft motion-reduce:overflow-x-auto"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <span className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-brand-fg">
          Breaking
        </span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex w-max">
            {track(false)}
            {track(true)}
          </div>
        </div>
      </div>
    </section>
  );
}
