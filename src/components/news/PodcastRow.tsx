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
 * The horizontal "Listen Anytime" episode row: art, kicker, headline, duration
 * and date, then a circular brand play control — the compact card of the radio
 * page, not the archive's long-form card.
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
        "group relative isolate flex h-full items-center gap-3.5 border border-line bg-surface p-3",
        "transition-[border-color,box-shadow] duration-200",
        "hover:border-line-strong hover:shadow-card focus-within:border-brand/40",
        className,
      )}
    >
      <div className="relative h-[74px] w-[74px] shrink-0 overflow-hidden bg-surface-2">
        <Image
          src={episode.image.src}
          alt={episode.image.alt}
          fill
          sizes="74px"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-[9px] font-bold tracking-[0.14em] text-brand uppercase">
          Podcast{show ? ` · ${show.name}` : ""}
        </p>

        <Heading className="mt-1 line-clamp-2 text-[13px] leading-[1.35] font-semibold tracking-[-0.005em] text-ink">
          <Link
            href={`/podcasts#${episode.slug}`}
            className="rounded-sm after:absolute after:inset-0 after:content-[''] hover:text-brand focus-visible:focus-ring"
          >
            {episode.title}
          </Link>
        </Heading>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[10.5px] text-muted">
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
        className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors duration-150 hover:bg-brand-hover focus-visible:focus-ring"
      >
        <IconPlay className="h-4 w-4 translate-x-px" aria-hidden="true" />
      </button>
    </article>
  );
}
