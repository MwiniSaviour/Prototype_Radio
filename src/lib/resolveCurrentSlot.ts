/**
 * Shared schedule resolver for the radio surfaces.
 *
 * Turns a weekday-keyed schedule into flattened, day-offset-aware slot
 * occurrences and answers "what is on now and next". The mapping mirrors the
 * one that lived inside `ShowScheduleRail.buildRows` so the homepage rail and
 * the live player hero stay semantically identical, and so the behaviour can
 * be unit-tested in isolation (midnight-crossing slots included).
 */

export type Weekday =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface SlotOccurrence<T> {
  /** The original schedule entry (e.g. a `ScheduleRow`). */
  item: T;
  /** The weekday the slot is *listed* under, not the calendar day it may run into. */
  day: Weekday;
  /** Original `"H:MM"`/`"HH:MM"` strings, kept verbatim for display. */
  start: string;
  end: string;
  /** Minutes since Sunday 00:00, including the day offset. */
  startMinutes: number;
  endMinutes: number;
  /** True for rows anchored to the `now` day (offset 0). */
  isToday: boolean;
}

interface SlotItem {
  start: string;
  end: string;
}

const MINUTES_PER_DAY = 1440;

/** Sunday-first to match `Date.prototype.getDay()`. */
const DAY_ORDER: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function toMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) {
    throw new RangeError(`Expected "H:MM" or "HH:MM", received "${time}"`);
  }
  const hours = Number(match[1] ?? "");
  const minutes = Number(match[2] ?? "");
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    throw new RangeError(`Expected "H:MM" or "HH:MM", received "${time}"`);
  }
  if (hours > 24 || minutes > 59 || (hours === 24 && minutes !== 0)) {
    throw new RangeError(
      `Time "${time}" is out of range: hours 0-24, minutes 0-59, and only "24:00" may use hour 24`,
    );
  }
  return hours * 60 + minutes;
}

function toOccurrence<T extends SlotItem>(
  item: T,
  day: Weekday,
  dayOffset: number,
): SlotOccurrence<T> {
  const startMinutes = toMinutes(item.start) + dayOffset * MINUTES_PER_DAY;
  let endMinutes = toMinutes(item.end) + dayOffset * MINUTES_PER_DAY;
  if (endMinutes <= startMinutes) endMinutes += MINUTES_PER_DAY; // slot crosses midnight
  return {
    item,
    day,
    start: item.start,
    end: item.end,
    startMinutes,
    endMinutes,
    isToday: dayOffset === 0,
  };
}

/**
 * Flattens today's and tomorrow's rows into one time-ordered list and computes
 * the live/next indices against `now`. Rows keep their listing order within
 * a day; "next" is the first occurrence that starts strictly after the
 * current minute (so a live anchor always wins over it).
 */
function indexSchedule<T extends SlotItem>(
  schedule: Record<Weekday, readonly T[]>,
  now: Date,
) {
  const todayIndex = now.getDay();
  const today = DAY_ORDER[todayIndex];
  const tomorrow = DAY_ORDER[(todayIndex + 1) % 7];

  const rows = [
    ...schedule[today].map((item) => toOccurrence(item, today, 0)),
    ...schedule[tomorrow].map((item) => toOccurrence(item, tomorrow, 1)),
  ];

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const liveIndex = rows.findIndex(
    (row) => nowMinutes >= row.startMinutes && nowMinutes < row.endMinutes,
  );
  const nextIndex = rows.findIndex((row) => row.startMinutes > nowMinutes);
  const startIndex = liveIndex >= 0 ? liveIndex : Math.max(nextIndex, 0);

  return { rows, liveIndex, nextIndex, startIndex };
}

/**
 * Today's rows (day offset 0) followed by tomorrow's rows (day offset +1),
 * mapped exactly like the rail's `dayRows`. Kept exported so components can
 * build their own windows from the same flattening the resolver uses.
 */
export function extractSchedule<T extends SlotItem>(
  schedule: Record<Weekday, readonly T[]>,
  now: Date = new Date(),
): SlotOccurrence<T>[] {
  return indexSchedule(schedule, now).rows;
}

export function resolveCurrentSlot<T extends SlotItem>(
  schedule: Record<Weekday, readonly T[]>,
  now: Date,
): { live: SlotOccurrence<T> | null; next: SlotOccurrence<T> | null; anchorIsLive: boolean } {
  const { rows, liveIndex, nextIndex } = indexSchedule(schedule, now);
  return {
    live: liveIndex >= 0 ? rows[liveIndex] : null,
    next: nextIndex >= 0 ? rows[nextIndex] : null,
    anchorIsLive: liveIndex >= 0,
  };
}

/**
 * A rolling window that always starts at the live slot (or at "next" when
 * nothing is on air), so a rail never has to lead with already-finished rows.
 * Mirrors `ShowScheduleRail.slice(startIndex, startIndex + count)`.
 */
export function rollingWindow<T extends SlotItem>(
  schedule: Record<Weekday, readonly T[]>,
  now: Date,
  count: number,
): { occurrences: SlotOccurrence<T>[]; anchorIsLive: boolean } {
  const { rows, startIndex, liveIndex } = indexSchedule(schedule, now);
  return {
    occurrences: rows.slice(startIndex, startIndex + count),
    anchorIsLive: liveIndex >= 0,
  };
}
