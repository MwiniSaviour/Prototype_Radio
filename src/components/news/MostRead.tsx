import Link from "next/link";
import type { Article } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Reader analytics are demo data in this prototype (the CMS stores no counters),
 * so the figure is derived from the article's rank — stable across renders and
 * never presented as a live metric anywhere else.
 */
function demoViews(rank: number): string {
  const base = 8.2 - rank * 1.6 + (rank % 3 === 0 ? 0.4 : 0);
  return `${base.toFixed(1)}K views`;
}

export function MostRead({
  articles,
  className,
}: {
  articles: Article[];
  className?: string;
}) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="most-read-heading" className={cn("border-t border-line pt-4", className)}>
      <h2
        id="most-read-heading"
        className="text-[11px] font-bold tracking-[0.14em] text-ink uppercase"
      >
        Most read
      </h2>

      <ol className="mt-1">
        {articles.slice(0, 5).map((article, index) => (
          <li
            key={article.id}
            className="flex items-start gap-3 border-b border-line/80 py-3 last:border-b-0"
          >
            <span
              aria-hidden="true"
              className="w-3 shrink-0 pt-[1px] text-[13px] leading-[1.45] tabular-nums text-ink/45"
            >
              {index + 1}
            </span>
            <Link
              href={`/article/${article.slug}`}
              className="min-w-0 flex-1 text-[13.5px] leading-[1.45] font-medium text-ink transition-colors hover:text-brand"
            >
              {article.title}
            </Link>
            <span className="hidden shrink-0 pt-[2px] text-[10.5px] whitespace-nowrap tabular-nums text-muted-soft sm:block">
              {demoViews(index)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
