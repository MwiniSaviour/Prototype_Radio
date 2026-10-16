import Link from "next/link";
import type { PodcastEpisode, Show } from "@/lib/types";
import { cn } from "@/lib/utils";
import { IconArrowRight, IconWaveform } from "@/components/ui/icons";
import { PodcastRow } from "./PodcastRow";

export interface ListenAnytimeItem {
  episode: PodcastEpisode;
  show?: Show;
}

export interface ListenAnytimeProps {
  /** Rendered as the h2 id and wired to the wrapping section's aria-labelledby. */
  headingId: string;
  /** Split eyebrow: the muted lead-in and the accent tail, e.g. "Podcasts" / "& Featured". */
  eyebrow: { muted: string; accent: string };
  title: string;
  description?: string;
  action?: { label: string; href: string };
  items: ListenAnytimeItem[];
  /** Heading level for each row's title — h4 keeps the outline valid under this h2. */
  rowHeadingLevel?: "h3" | "h4";
  className?: string;
}

/**
 * The podcast showcase: waveform eyebrow, serif display heading, an optional
 * right-aligned link and a 3-up row-card grid. Shared by the homepage section
 * and the podcasts page so both read as one system.
 */
export function ListenAnytime({
  headingId,
  eyebrow,
  title,
  description,
  action,
  items,
  rowHeadingLevel = "h3",
  className,
}: ListenAnytimeProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[0.6875rem] font-bold tracking-[0.2em] text-muted uppercase">
            <IconWaveform className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            <span>{eyebrow.muted}</span>
            <span className="text-brand">{eyebrow.accent}</span>
          </p>
          <h2
            id={headingId}
            className="mt-2.5 font-display text-3xl leading-[1.08] font-extrabold tracking-tight text-ink sm:text-4xl"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>

        {action ? (
          <Link
            href={action.href}
            className="group/link inline-flex shrink-0 items-center gap-2 rounded-sm pb-1 text-sm font-semibold text-muted transition-colors hover:text-ink focus-visible:focus-ring"
          >
            {action.label}
            <IconArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1 motion-reduce:group-hover/link:translate-x-0"
              aria-hidden="true"
            />
          </Link>
        ) : null}
      </div>

      <ul className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ episode, show }) => (
          <li key={episode.id} className="h-full">
            <PodcastRow
              episode={episode}
              show={show}
              headingLevel={rowHeadingLevel}
              className="h-full"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}