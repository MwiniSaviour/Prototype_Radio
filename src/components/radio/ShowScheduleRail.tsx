import Link from "next/link";
import type { Show, Weekday } from "@/lib/types";
import { getScheduleByDay, type ScheduleByDay } from "@/content";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IconArrowRight, IconChevronRight } from "@/components/ui/icons";

export interface ShowScheduleRailProps {
  className?: string;
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

const DAY_SHORT: Record<Weekday, string> = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

const ROW_COUNT = 6;

interface RailRow {
  key: string;
  show: Show;
  day: Weekday;
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  isToday: boolean;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * A rolling window of the schedule starting at the live (or next) show, so the
 * rail always answers "what is on now and next" instead of always showing
 * 00:00 rows. When the window spills into tomorrow, those rows carry a weekday
 * prefix so times are never ambiguous.
 */
function buildRows(schedule: ScheduleByDay, now: Date): { rows: RailRow[]; anchorIsLive: boolean } {
  const todayIndex = now.getDay();
  const today = DAY_ORDER[todayIndex];
  const tomorrow = DAY_ORDER[(todayIndex + 1) % 7];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const dayRows = (day: Weekday, offset: number): RailRow[] =>
    schedule[day].map((row) => {
      const startMinutes = toMinutes(row.start) + offset * 1440;
      let endMinutes = toMinutes(row.end) + offset * 1440;
      if (endMinutes <= startMinutes) endMinutes += 1440; // slot crosses midnight
      return {
        key: `${row.show.id}-${row.start}`,
        show: row.show,
        day,
        start: row.start,
        end: row.end,
        startMinutes,
        endMinutes,
        isToday: offset === 0,
      };
    });

  const rows = [...dayRows(today, 0), ...dayRows(tomorrow, 1)];
  const liveIndex = rows.findIndex(
    (row) => nowMinutes >= row.startMinutes && nowMinutes < row.endMinutes,
  );
  const nextIndex = rows.findIndex((row) => row.startMinutes > nowMinutes);
  const startIndex = liveIndex >= 0 ? liveIndex : Math.max(nextIndex, 0);

  return { rows: rows.slice(startIndex, startIndex + ROW_COUNT), anchorIsLive: liveIndex >= 0 };
}

/**
 * The homepage rail's "Show Schedule" card: a compact, time-ordered list of the
 * live/next hours, each row linking into the shows page. Separate from the
 * table-based ShowSchedule so /shows keeps its full weekly grid.
 */
export async function ShowScheduleRail({ className }: ShowScheduleRailProps) {
  const schedule = await getScheduleByDay();
  const { rows, anchorIsLive } = buildRows(schedule, new Date());

  return (
    <section
      aria-labelledby="schedule-rail-heading"
      className={cn(
        "flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="schedule-rail-heading"
          className="text-[0.6875rem] font-bold tracking-[0.18em] text-muted uppercase"
        >
          SHOW SCHEDULE
        </h2>
        <Link
          href="/shows"
          className="group/link inline-flex items-center gap-1.5 rounded-sm text-xs font-semibold text-muted transition-colors hover:text-brand focus-visible:focus-ring"
        >
          View Full Schedule
          <IconArrowRight
            className="h-3.5 w-3.5 motion-safe:transition-transform group-hover/link:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      <ul className="-mx-5 mt-3 flex-1 divide-y divide-line">
        {rows.map((row, index) => {
          const isAnchor = index === 0;
          const hosts = row.show.hosts.map((host) => host.name).join(", ");

          return (
            <li key={row.key} className="relative">
              <Link
                href={`/shows#${row.show.slug}`}
                aria-current={isAnchor && anchorIsLive ? "true" : undefined}
                className="group/row relative flex items-center gap-2.5 py-3 pr-1 pl-5 focus-visible:focus-ring"
              >
                {isAnchor ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-brand"
                  />
                ) : null}

                <span className="flex w-16 shrink-0 flex-col">
                  {row.isToday ? null : (
                    <span className="text-[0.625rem] font-bold tracking-wider text-muted uppercase">
                      {DAY_SHORT[row.day]}
                    </span>
                  )}
                  <time
                    dateTime={row.start}
                    className="text-xs font-semibold text-ink tabular-nums"
                  >
                    {formatClock(row.start)}
                  </time>
                </span>

                <span aria-hidden="true" className="h-5 w-px shrink-0 bg-line" />

                <span className="shrink-0 text-[0.8125rem] font-semibold text-ink motion-safe:transition-colors group-hover/row:text-brand">
                  {row.show.name}
                </span>

                <span aria-hidden="true" className="h-4 w-px shrink-0 bg-line" />

                <span className="min-w-0 flex-1 truncate text-[0.6875rem] text-muted">
                  {hosts}
                </span>

                <IconChevronRight
                  className="h-4 w-4 shrink-0 text-muted motion-safe:transition-transform group-hover/row:translate-x-0.5"
                  aria-hidden="true"
                />
                {isAnchor ? (
                  <span className="sr-only">{anchorIsLive ? "On air now" : "Up next"}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
