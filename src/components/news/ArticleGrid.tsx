import type { Article } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconInbox } from "@/components/ui/icons";
import { ArticleCard, type ArticleCardVariant } from "./ArticleCard";

export interface ArticleGridProps {
  articles: Article[];
  variant?: ArticleCardVariant;
  columns?: 1 | 2 | 3 | 4;
  /** Number of leading images that should preload (hero images only). */
  priorityCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

const columnClasses: Record<1 | 2 | 3 | 4, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function ArticleGrid({
  articles,
  variant = "default",
  columns = 3,
  priorityCount = 0,
  emptyTitle = "Nothing here yet",
  emptyDescription = "New stories land here as the newsroom publishes them.",
  className,
}: ArticleGridProps) {
  if (articles.length === 0) {
    return (
      <EmptyState
        icon={<IconInbox className="h-8 w-8" aria-hidden="true" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <ul
      className={cn(
        "grid gap-6",
        variant === "list" ? "grid-cols-1" : columnClasses[columns],
        className,
      )}
    >
      {articles.map((article, index) => (
        <li key={article.id}>
          <ArticleCard
            article={article}
            variant={variant}
            priority={index < priorityCount}
            className="h-full"
          />
        </li>
      ))}
    </ul>
  );
}
