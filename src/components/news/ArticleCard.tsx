import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { cn } from "@/lib/utils";
import { IconArrowRight } from "@/components/ui/icons";
import { Byline } from "./Byline";

export type ArticleCardVariant = "hero" | "feature" | "default" | "compact" | "list";

export interface ArticleCardProps {
  article: Article;
  variant?: ArticleCardVariant;
  /** Only the single above-the-fold image should set this. */
  priority?: boolean;
  headingLevel?: 2 | 3;
  showExcerpt?: boolean;
  className?: string;
}

const imageSizes: Record<ArticleCardVariant, string> = {
  hero: "(max-width: 1024px) 100vw, 66vw",
  feature: "(max-width: 768px) 100vw, 50vw",
  default: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  compact: "112px",
  list: "(max-width: 768px) 100vw, 320px",
};

const imageAspect: Record<ArticleCardVariant, string> = {
  hero: "aspect-[16/10] sm:aspect-[1000/285]",
  feature: "aspect-[4/3]",
  default: "aspect-[16/10.2]",
  compact: "aspect-square",
  list: "aspect-video",
};

function CategoryBadge({ article }: { article: Article }) {
  return (
    <span className="text-[10px] font-bold tracking-[0.14em] text-brand uppercase">
      {article.category.name}
    </span>
  );
}

function ArticleImage({
  article,
  variant,
  priority,
}: {
  article: Article;
  variant: ArticleCardVariant;
  priority: boolean;
}) {
  const rounded = variant === "compact" ? "rounded-[3px]" : "rounded-[2px]";

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-2",
        imageAspect[variant],
        rounded,
        variant === "hero" && "absolute inset-0 aspect-auto rounded-card",
      )}
    >
      <Image
        src={article.image.src}
        alt={article.image.alt}
        fill
        sizes={imageSizes[variant]}
        priority={priority}
        className={cn(
          "object-cover transition-transform duration-500 ease-out",
          "motion-safe:group-hover:scale-[1.035] motion-reduce:transition-none",
        )}
      />
    </div>
  );
}

export function ArticleCard({
  article,
  variant = "default",
  priority = false,
  headingLevel,
  showExcerpt = true,
  className,
}: ArticleCardProps) {
  const heading = headingLevel ?? (variant === "hero" || variant === "feature" ? 2 : 3);
  const Heading = heading === 2 ? "h2" : "h3";
  const href = `/article/${article.slug}`;
  const titleClasses = "font-display font-bold tracking-[-0.01em] text-ink group-hover:text-brand motion-safe:transition-colors motion-safe:duration-150";

  if (variant === "hero") {
    return (
      <article className={cn("group relative", className)}>
        <Link href={href} className="block rounded-card focus-visible:focus-ring">
          <div className="relative overflow-hidden rounded-card border border-line">
            <ArticleImage article={article} variant="hero" priority={priority} />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/65 to-ink/15"
            />
            <div className="relative flex min-h-[22rem] flex-col justify-end gap-3 p-5 sm:min-h-[26rem] sm:p-8">
              <div className="flex items-center gap-2">
                <CategoryBadge article={article} />
                {article.breaking ? (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-brand">
                    Breaking
                  </span>
                ) : null}
              </div>
              <Heading className={cn(titleClasses, "text-2xl text-white sm:text-4xl", "group-hover:text-white")}>
                {article.title}
              </Heading>
              <p className="hidden max-w-2xl text-sm leading-relaxed text-white/85 sm:block">
                {article.excerpt}
              </p>
              <Byline author={article.author} publishedAt={article.publishedAt} readingMinutes={article.readingMinutes} tone="onDark" />
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "feature") {
    return (
      <article className={cn("group", className)}>
        <Link
          href={href}
          className="grid items-center gap-5 rounded-card focus-visible:focus-ring sm:grid-cols-2"
        >
          <div className="order-2 sm:order-1">
            <CategoryBadge article={article} />
            <Heading className={cn(titleClasses, "mt-3 text-xl sm:text-2xl")}>
              {article.title}
            </Heading>
            {showExcerpt ? (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                {article.excerpt}
              </p>
            ) : null}
            <Byline
              author={article.author}
              publishedAt={article.publishedAt}
              readingMinutes={article.readingMinutes}
              className="mt-3"
            />
          </div>
          <div className="order-1 sm:order-2">
            <ArticleImage article={article} variant="feature" priority={priority} />
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className={cn("group", className)}>
        <Link href={href} className="flex gap-3 rounded-lg focus-visible:focus-ring">
          <div className="w-24 shrink-0 sm:w-28">
            <ArticleImage article={article} variant="compact" priority={priority} />
          </div>
          <div className="min-w-0 flex-1">
            <Heading className={cn(titleClasses, "line-clamp-3 text-sm leading-snug")}>
              {article.title}
            </Heading>
            <p className="mt-1.5 text-xs text-muted">
              {article.category.name} · <time dateTime={article.publishedAt}>{formatShort(article.publishedAt)}</time>
            </p>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "list") {
    return (
      <article className={cn("group", className)}>
        <Link
          href={href}
          className="grid gap-4 rounded-card focus-visible:focus-ring sm:grid-cols-[20rem_1fr]"
        >
          <ArticleImage article={article} variant="list" priority={priority} />
          <div className="flex flex-col justify-center">
            <CategoryBadge article={article} />
            <Heading className={cn(titleClasses, "mt-2 text-lg sm:text-xl")}>
              {article.title}
            </Heading>
            {showExcerpt ? (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                {article.excerpt}
              </p>
            ) : null}
            <Byline
              author={article.author}
              publishedAt={article.publishedAt}
              readingMinutes={article.readingMinutes}
              className="mt-3"
            />
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
              Read the story
              <IconArrowRight className="h-4 w-4 motion-safe:transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className={cn("group flex flex-col", className)}>
      <Link href={href} className="flex h-full flex-col rounded-[2px] focus-visible:focus-ring">
        <ArticleImage article={article} variant="default" priority={priority} />
        <div className="flex flex-1 flex-col pt-3">
          <CategoryBadge article={article} />
          <Heading className={cn(titleClasses, "mt-1.5 text-[19px] leading-[1.22]")}>
            {article.title}
          </Heading>
          {showExcerpt ? (
            <p className="mt-1.5 line-clamp-3 flex-1 text-[12.5px] leading-[1.5] text-muted">
              {article.excerpt}
            </p>
          ) : null}
          {/* The grid's footer is a stamp, not a full byline: small caps, no avatar. */}
          <p className="mt-2.5 flex flex-wrap items-center gap-x-2 text-[10px] font-semibold tracking-[0.12em] text-muted-soft uppercase">
            <span>{article.author.name}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt}>{formatShort(article.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span className="normal-case tracking-normal">{article.readingMinutes} min read</span>
          </p>
        </div>
      </Link>
    </article>
  );
}

function formatShort(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(iso),
  );
}
