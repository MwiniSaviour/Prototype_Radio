import Image from "next/image";
import Link from "next/link";
import type { Show, ShowSlot, Weekday } from "@/lib/types";
import { getScheduleByDay, getCurrentShow, getNextShow, getShows } from "@/content";
import { formatClock, formatDayRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { IconArrowRight, IconChevronRight, IconWaveform } from "@/components/ui/icons";

export interface TodaysShowsProps {
  headingId?: string;
  className?: string;
  /** Resolved by the page that already knows the on-air state; omitted callers fall back to the content layer. */
  currentShow?: Show | null;
  nextShow?: { show: Show; slot: ShowSlot } | null;
}

const DAY_ORDER: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const CARD_COUNT = 4;

interface TodayEntry {
  show: Show;
  start: string;
  end: string;
}

/**
 * Today's running order, de-duplicated by show and topped up from the roster
 * on light days so the four-card row of the reference always reads cleanly.
 */
async function buildEntries(): Promise<TodayEntry[]> {
  const now = new Date();
  const schedule = (await getScheduleByDay())[DAY_ORDER[now.getDay()]];
  const seen = new Set<string>();
  const entries: TodayEntry[] = [];

  for (const row of schedule) {
    if (seen.has(row.show.id)) continue;
    seen.add(row.show.id);
    entries.push({ show: row.show, start: row.start, end: row.end });
  }

  for (const show of await getShows()) {
    if (entries.length >= CARD_COUNT) break;
    if (seen.has(show.id)) continue;
    seen.add(show.id);
    const slot = show.schedule[0];
    entries.push({ show, start: slot.start, end: slot.end });
  }

  return entries.slice(0, CARD_COUNT);
}

/**
 * "Today's Shows" — the four-card row under the hero. Badges are data-driven:
 * the card for the live show reads ON AIR, the next one UP NEXT; when neither
 * is in the row, no badge is shown rather than inventing a live state.
 */
export async function TodaysShows({
  headingId = "todays-shows-heading",
  className,
  currentShow: currentShowProp,
  nextShow: nextShowProp,
}: TodaysShowsProps) {
  const entries = await buildEntries();
  const currentShow = currentShowProp !== undefined ? currentShowProp : await getCurrentShow();
  const nextShow = nextShowProp !== undefined ? nextShowProp : await getNextShow();

  const badgeFor = (show: Show): string | null => {
    if (currentShow && show.id === currentShow.id) return "ON AIR";
    if (!currentShow && nextShow && show.id === nextShow.show.id) return "UP NEXT";
    return null;
  };

  return (
    <section aria-labelledby={headingId} className={cn("min-w-0", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[0.6875rem] font-bold tracking-[0.2em] text-brand uppercase">
            <IconWaveform className="h-4 w-4 shrink-0" aria-hidden="true" />
            ON AIR &amp; UP NEXT
          </p>
          <h2
            id={headingId}
            className="mt-2.5 font-display text-3xl leading-[1.08] font-extrabold tracking-tight text-ink sm:text-4xl"
          >
            Today&rsquo;s Shows
          </h2>
        </div>

        <Link
          href="/shows"
          className="group/link inline-flex shrink-0 items-center gap-2 rounded-sm pb-1 text-sm font-semibold text-muted transition-colors hover:text-ink focus-visible:focus-ring"
        >
          View All Shows
          <IconArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1 motion-reduce:group-hover/link:translate-x-0"
            aria-hidden="true"
          />
        </Link>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {entries.map(({ show, start, end }) => {
          const badge = badgeFor(show);
          const hosts = show.hosts.map((host) => host.name).join(" & ");
          const days = formatDayRange(show.schedule.map((slot) => slot.day));

          return (
            <li key={show.id} className="h-full">
              <article
                className={cn(
                  "group relative isolate flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface",
                  "transition-[border-color,box-shadow,transform] duration-200",
                  "hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-pop",
                  "focus-within:border-brand/35 motion-reduce:transform-none motion-reduce:hover:translate-y-0",
                )}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
                  <Image
                    src={show.image.src}
                    alt={show.image.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1279px) 50vw, 22vw"
                    className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.035]"
                  />
                  {badge ? (
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center rounded-full bg-brand px-2.5 py-1 text-[0.625rem] font-bold tracking-wider text-brand-fg uppercase">
                      {badge}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 font-display text-base leading-snug font-bold tracking-tight text-ink">
                      {/* The ::after overlay makes the whole card a hit target;
                          no other interactive elements share this area. */}
                      <Link
                        href={`/shows#${show.slug}`}
                        className="rounded-sm after:absolute after:inset-0 after:content-[''] hover:text-brand focus-visible:focus-ring"
                      >
                        {show.name}
                      </Link>
                    </h3>
                    <IconChevronRight
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted motion-safe:transition-transform group-hover:translate-x-0.5 motion-safe:group-hover:text-brand"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-2 text-xs text-muted tabular-nums">
                    {formatClock(start)} – {formatClock(end)}
                    <span aria-hidden="true" className="mx-1.5 text-line">
                      |
                    </span>
                    {days}
                  </p>

                  <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
                    {show.tagline}
                  </p>

                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                    <Avatar name={show.hosts[0].name} src={show.hosts[0].avatarUrl} size="xs" />
                    <p className="truncate text-xs text-muted">
                      Hosted by <span className="font-medium text-ink">{hosts}</span>
                    </p>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
