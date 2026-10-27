import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The front page's lead: a wide photograph, the orange desk kicker, the largest
 * serif headline on the page, the deck and the newsroom stamp.
 */
export function BigStory({
  article,
  priority = true,
  className,
}: {
  article: Article;
  priority?: boolean;
  className?: string;
}) {
  return (
    <article className={cn("group", className)}>
      <Link href={`/article/${article.slug}`} className="block rounded-sm focus-visible:focus-ring">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-2 sm:aspect-[1000/285]">
          <Image
            src={article.image.src}
            alt={article.image.alt}
            fill
            sizes="(max-width: 1023px) 100vw, 68vw"
            priority={priority}
            className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.02]"
          />
        </div>

        <p className="mt-4 text-[11px] font-bold tracking-[0.14em] text-brand uppercase">
          The big story
        </p>

        <h1 className="mt-2 max-w-[46rem] font-display text-[28px] leading-[1.13] font-bold tracking-[-0.012em] text-ink transition-colors group-hover:text-brand sm:text-[36px] lg:text-[40px]">
          {article.title}
        </h1>

        <p className="mt-3 max-w-[42rem] text-[14.5px] leading-[1.55] text-ink-soft">
          {article.excerpt}
        </p>

        <p className="mt-4 flex flex-wrap items-center gap-x-2 text-[10px] font-semibold tracking-[0.14em] text-muted-soft uppercase">
          <span>{article.author.name}</span>
          <span aria-hidden="true" className="text-line-strong">
            ·
          </span>
          <time dateTime={article.publishedAt}>{formatRelativeTime(article.publishedAt)}</time>
        </p>
      </Link>
    </article>
  );
}
