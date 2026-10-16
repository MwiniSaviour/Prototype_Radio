import type { Author } from "@/lib/types";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { IconClock } from "@/components/ui/icons";

export interface BylineProps {
  author: Author;
  publishedAt: string;
  readingMinutes?: number;
  updatedAt?: string;
  /** "onDark" for use over the hero card's image overlay. */
  tone?: "default" | "onDark";
  className?: string;
}

export function Byline({
  author,
  publishedAt,
  readingMinutes,
  updatedAt,
  tone = "default",
  className,
}: BylineProps) {
  const onDark = tone === "onDark";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs",
        onDark ? "text-white/85" : "text-muted",
        className,
      )}
    >
      <Avatar name={author.name} src={author.avatarUrl} size="xs" />
      <span className={cn("font-semibold", onDark ? "text-white" : "text-ink")}>
        {author.name}
      </span>
      <span aria-hidden="true">·</span>
      <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
      {updatedAt ? (
        <>
          <span aria-hidden="true">·</span>
          <span>updated {formatRelativeTime(updatedAt)}</span>
        </>
      ) : null}
      {readingMinutes ? (
        <>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <IconClock className="h-3.5 w-3.5" aria-hidden="true" />
            {readingMinutes} min read
          </span>
        </>
      ) : null}
    </div>
  );
}
