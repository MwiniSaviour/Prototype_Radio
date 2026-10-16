import Link from "next/link";
import type { Show, Weekday } from "@/lib/types";
import { formatClock } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

const WEEKDAY_ORDER: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

interface ScheduleRow {
  show: Show;
  day: Weekday;
  start: string;
  end: string;
}

function buildRows(shows: Show[]): ScheduleRow[] {
  return shows
    .flatMap((show) =>
      show.schedule.map((slot) => ({ show, day: slot.day, start: slot.start, end: slot.end })),
    )
    .sort((a, b) => {
      const dayDelta = WEEKDAY_ORDER.indexOf(a.day) - WEEKDAY_ORDER.indexOf(b.day);
      return dayDelta !== 0 ? dayDelta : a.start.localeCompare(b.start);
    });
}

export interface ShowScheduleProps {
  shows: Show[];
  className?: string;
}

/**
 * Weekly schedule as a real table: caption describes it, today's row carries
 * aria-current, and times use <time dateTime> so they are machine-readable.
 */
export function ShowSchedule({ shows, className }: ShowScheduleProps) {
  const rows = buildRows(shows);
  const today = WEEKDAY_ORDER[new Date().getDay()];

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <caption className="sr-only">
          Weekly broadcast schedule for every show, sorted by day and start time.
        </caption>
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-muted">
            <th scope="col" className="py-2.5 pr-4 font-semibold">
              Day
            </th>
            <th scope="col" className="py-2.5 pr-4 font-semibold">
              Time
            </th>
            <th scope="col" className="py-2.5 pr-4 font-semibold">
              Show
            </th>
            <th scope="col" className="py-2.5 font-semibold">
              Hosts
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isToday = row.day === today;
            return (
              <tr
                key={`${row.show.id}-${row.day}-${row.start}`}
                aria-current={isToday ? "date" : undefined}
                className={cn(
                  "border-b border-line align-middle",
                  isToday && "bg-surface-2 font-medium",
                )}
              >
                <td className="py-3 pr-4 capitalize text-ink">
                  {row.day}
                  {isToday ? (
                    <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-brand-fg">
                      Today
                    </span>
                  ) : null}
                </td>
                <td className="py-3 pr-4 tabular-nums text-ink">
                  <time dateTime={row.start}>{formatClock(row.start)}</time>
                  {" – "}
                  <time dateTime={row.end}>{formatClock(row.end)}</time>
                </td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/shows#${row.show.slug}`}
                    className="rounded-sm font-semibold text-ink hover:text-brand hover:underline focus-visible:focus-ring"
                  >
                    {row.show.name}
                  </Link>
                </td>
                <td className="py-3">
                  <span className="flex items-center gap-2 text-muted">
                    <span className="flex -space-x-2">
                      {row.show.hosts.slice(0, 3).map((host) => (
                        <Avatar key={host.id} name={host.name} src={host.avatarUrl} size="xs" className="ring-2 ring-paper" />
                      ))}
                    </span>
                    {row.show.hosts.map((host) => host.name).join(", ")}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
