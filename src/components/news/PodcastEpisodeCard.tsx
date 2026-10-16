import Image from "next/image";
import Link from "next/link";
import type { PodcastEpisode, Show } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDate, formatDuration } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { IconPlay } from "../ui/icons";

export interface PodcastEpisodeCardProps {
  episode: PodcastEpisode;
  show?: Show;
  className?: string;
}

/** Expansion-only: the play control is a shell — no audio engine is wired yet. */
export function PodcastEpisodeCard({ episode, show, className }: PodcastEpisodeCardProps) {
  return (
    <article
      className={cn(
        "group flex gap-4 rounded-card border border-line bg-surface p-4",
        "transition-[border-color,box-shadow] duration-200 hover:border-ink/20 hover:shadow-card",
        className,
      )}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:h-24 sm:w-24">
        <Image
          src={episode.image.src}
          alt={episode.image.alt}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span className="font-semibold text-brand">
            S{episode.season} E{episode.episodeNumber}
          </span>
          <span aria-hidden="true">·</span>
          <time dateTime={episode.publishedAt}>{formatDate(episode.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{formatDuration(episode.durationSeconds)}</span>
        </div>

        <h3 className="mt-1.5 font-display text-base leading-snug font-bold text-ink">
          <Link href={`/podcasts#${episode.slug}`} className="rounded-sm hover:text-brand focus-visible:focus-ring">
            {episode.title}
          </Link>
        </h3>

        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
          {episode.description}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {show ? (
            <Link
              href={`/shows#${show.slug}`}
              className="rounded-sm text-xs font-medium text-muted underline-offset-4 hover:text-ink hover:underline focus-visible:focus-ring"
            >
              from {show.name}
            </Link>
          ) : null}
          {episode.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="neutral" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label={`Play ${episode.title} (${Math.round(episode.durationSeconds / 60)} minutes)`}
        title="Play (not wired to audio yet)"
        className="inline-flex h-11 w-11 shrink-0 self-center items-center justify-center rounded-full bg-brand text-brand-fg shadow-card transition-colors duration-150 hover:bg-brand-hover focus-visible:focus-ring"
      >
        <IconPlay className="h-5 w-5" aria-hidden="true" />
      </button>
    </article>
  );
}
