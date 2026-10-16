import Link from "next/link";
import type { Article } from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface TrendingListProps {
  articles: Article[];
  className?: string;
}

export function TrendingList({ articles, className }: TrendingListProps) {
  return (
    <ol className={cn("divide-y divide-line", className)}>
      {articles.map((article, index) => (
        <li key={article.id}>
          <Link
            href={`/article/${article.slug}`}
            className="group flex items-start gap-4 rounded-lg py-3.5 focus-visible:focus-ring"
          >
            <span
              aria-hidden="true"
              className="w-6 shrink-0 text-center font-display text-xl font-extrabold text-brand"
            >
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base leading-snug font-bold text-ink group-hover:text-brand motion-safe:transition-colors">
                {article.title}
              </span>
              <span className="mt-1 block text-xs text-muted">
                {article.category.name} · <time dateTime={article.publishedAt}>{formatRelativeTime(article.publishedAt)}</time>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
