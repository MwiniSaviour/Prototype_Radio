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

  const rows: RailRow[] = [];
  const push = (day: Weekday, rowsForDay: ScheduleByDay[Weekday]) => {
    for (const row of rowsForDay) {
      rows.push({
        key: `${day}-${row.show.id}-${row.start}`,
        show: row.show,
        day,
        start: row.start,
        end: row.end,
        startMinutes: toMinutes(row.start),
        endMinutes: toMinutes(row.end),
        isToday: day === today,
      });
    }
  };

  push(today, schedule[today]);
  push(tomorrow, schedule[tomorrow]);

  const anchor = rows.findIndex((row) => row.isToday && row.startMinutes <= nowMinutes && nowMinutes < row.endMinutes);
  const nextIndex = rows.findIndex((row) => row.isToday && row.startMinutes > nowMinutes);
  const startIndex = anchor >= 0 ? anchor : nextIndex >= 0 ? nextIndex : 0;

  return {
    rows: rows.slice(startIndex, startIndex + ROW_COUNT),
    anchorIsLive: anchor >= 0,
  };
}

/**
 * The rail's schedule card: what is on now and for the rest of the day, with
 * the live row flagged by the brand rule. "View full schedule" opens the seven
 * day grid on the radio page.
 */
export async function ShowScheduleRail({ className }: ShowScheduleRailProps) {
  const schedule = await getScheduleByDay();
  const now = new Date();
  const today = DAY_ORDER[now.getDay()];
  const { rows } = buildRows(schedule, now);

  return (
    <section
      aria-labelledby="show-schedule-heading"
      className={cn("flex flex-col border border-line bg-surface", className)}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2.5">
        <h2
          id="show-schedule-heading"
          className="text-[11px] font-bold tracking-[0.14em] text-ink uppercase"
        >
          Show schedule
        </h2>
        <Link
          href="/shows#schedule"
          className="group flex items-center gap-1.5 text-[11px] font-medium text-muted transition-colors hover:text-brand"
        >
          View full schedule
          <IconArrowRight
            className="h-3 w-3 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      <ul className="flex-1">
        {rows.map((row) => {
          const live = row.isToday && row.startMinutes <= now.getHours() * 60 + now.getMinutes() && now.getHours() * 60 + now.getMinutes() < row.endMinutes;
          return (
            <li key={row.key} className="border-t border-line/80">
              <Link
                href="/shows#schedule"
                className={cn(
                  "flex items-center gap-3 border-l-2 py-3 pr-3.5 pl-3.5 transition-colors hover:bg-surface-2/60",
                  live ? "border-l-brand" : "border-l-transparent",
                )}
              >
                <span className="w-[4.25rem] shrink-0 text-[10.5px] tracking-[0.04em] text-muted uppercase tabular-nums">
                  {row.isToday ? formatClock(row.start) : `${DAY_SHORT[row.day]} ${formatClock(row.start)}`}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">
                  {row.show.name}
                </span>
                <span aria-hidden="true" className="hidden h-3 w-px shrink-0 bg-line sm:block" />
                <span className="hidden max-w-[6.5rem] shrink-0 truncate text-[11px] text-muted sm:block">
                  {row.show.hosts[0]?.name}
                </span>
                <IconChevronRight className="h-3.5 w-3.5 shrink-0 text-ink/35" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-auto border-t border-line px-4 py-2.5 text-[10.5px] text-muted-soft">
        All times local · {today.charAt(0).toUpperCase() + today.slice(1)}
      </p>
    </section>
  );
}
