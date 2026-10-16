import type { IsoDate, Weekday } from "./types";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const relativeFormat = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

export function formatDate(iso: IsoDate): string {
  return dateFormat.format(new Date(iso));
}

export function formatDateTime(iso: IsoDate): string {
  return dateTimeFormat.format(new Date(iso));
}

export function formatRelativeTime(iso: IsoDate, now: Date = new Date()): string {
  let duration = (new Date(iso).getTime() - now.getTime()) / 1000;
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return relativeFormat.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return relativeFormat.format(Math.round(duration), "year");
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

/** Seconds -> "12:30" or "1:04:33". */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}

/** "14:30" -> "2:30 PM". */
export function formatClock(hhmm: string): string {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const WEEKDAY_POSITION: Record<Weekday, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

const WEEKDAY_SHORT: Record<Weekday, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

/** ["monday"..."friday"] -> "Mon – Fri"; all seven -> "Every day". */
export function formatDayRange(days: Weekday[]): string {
  const unique = [...new Set(days)].sort(
    (a, b) => WEEKDAY_POSITION[a] - WEEKDAY_POSITION[b],
  );
  if (unique.length === 0) return "";
  if (unique.length === 7) return "Every day";
  if (unique.length === 1) return WEEKDAY_SHORT[unique[0]];
  const consecutive = unique.every(
    (day, index) =>
      index === 0 || WEEKDAY_POSITION[day] === WEEKDAY_POSITION[unique[index - 1]] + 1,
  );
  if (consecutive) {
    return `${WEEKDAY_SHORT[unique[0]]} – ${WEEKDAY_SHORT[unique[unique.length - 1]]}`;
  }
  return unique.map((day) => WEEKDAY_SHORT[day]).join(", ");
}

/** "3 stories", "1 story" — count and word together. */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}
