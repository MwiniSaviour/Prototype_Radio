import Image from "next/image";
import Link from "next/link";
import type { PodcastEpisode, Show } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { IconPlay } from "@/components/ui/icons";

export interface PodcastRowProps {
  episode: PodcastEpisode;
  show?: Show;
  /** Keeps the page's heading outline valid where the row is nested in an h2 section. */
  headingLevel?: "h3" | "h4";
  className?: string;
}

/**
 * The horizontal "Listen Anytime" episode row: art, kicker, headline, meta and
 * a circular brand play control. Separate from PodcastEpisodeCard because the
 * archive card carries a description and tags that this denser row has no room
 * for, and because the homepage still renders the archive card.
 */
export function PodcastRow({
  episode,
  show,
  headingLevel: Heading = "h3",
  className,
}: PodcastRowProps) {
  const minutes = Math.round(episode.durationSeconds / 60);

  return (
    <article
      className={cn(
        "group relative isolate flex h-full items-stretch gap-4 rounded-card border border-line bg-surface p-4",
        "shadow-card transition-[border-color,box-shadow,transform] duration-200",
        "hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-pop",
        "focus-within:border-brand/35 motion-reduce:transform-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[0.75rem] bg-surface-2">
        <Image
          src={episode.image.src}
          alt={episode.image.alt}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-[0.6875rem] font-bold tracking-[0.14em] text-brand uppercase">
          {show?.name ?? "Podcast"}
        </p>

        <Heading className="mt-1.5 line-clamp-2 font-display text-[0.9375rem] leading-snug font-bold tracking-tight text-ink">
          {/* The ::after overlay makes the whole card a hit target; the play
              control is lifted above it with z-10 so it stays independently
              clickable. */}
          <Link
            href={`/podcasts#${episode.slug}`}
            className="rounded-sm after:absolute after:inset-0 after:content-[''] hover:text-brand focus-visible:focus-ring"
          >
            {episode.title}
          </Link>
        </Heading>

        <p className="mt-auto flex flex-wrap items-center gap-x-2 pt-2 text-xs text-muted">
          <span>{minutes} min</span>
          <span aria-hidden="true">·</span>
          <time dateTime={episode.publishedAt}>{formatDate(episode.publishedAt)}</time>
        </p>
      </div>

      {/* Expansion-only: the play control is a shell — no audio engine is wired yet. */}
      <button
        type="button"
        aria-label={`Play ${episode.title}`}
        title={`Play ${episode.title}`}
        className="relative z-10 inline-flex h-10 w-10 shrink-0 self-center items-center justify-center rounded-full bg-brand text-brand-fg shadow-card transition-[background-color,transform] duration-200 hover:scale-105 hover:bg-brand-hover focus-visible:focus-ring active:scale-95 motion-reduce:transform-none motion-reduce:hover:scale-100"
      >
        <IconPlay className="h-[1.125rem] w-[1.125rem] translate-x-px" aria-hidden="true" />
      </button>
    </article>
  );
}