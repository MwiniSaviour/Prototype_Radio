import type { Show, ShowSlot } from "@shared/lib/types";

/**
 * "Up Next" is derived from the shared programme schedule, never hard-coded:
 * every show carries its own weekday slots, so the next broadcast for each
 * programme is the earliest slot that has not started yet.
 */

const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export interface UpcomingProgramme {
  show: Show;
  slot: ShowSlot;
  /** Concrete date-time of the next airing. */
  startsAt: Date;
}

/** Next airing of one slot, counting from `now` (today included while it lasts). */
function nextAiring(slot: ShowSlot, now: Date): Date {
  const [hours, minutes] = slot.start.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hours % 24, minutes || 0, 0, 0);

  const wanted = DAY_INDEX[slot.day] ?? 0;
  let offset = (wanted - target.getDay() + 7) % 7;
  if (offset === 0 && target.getTime() <= now.getTime()) offset = 7;
  target.setDate(target.getDate() + offset);
  return target;
}

/** The next `limit` programmes on air, soonest first. */
export function upcomingProgrammes(shows: Show[], now = new Date(), limit = 6): UpcomingProgramme[] {
  const upcoming: UpcomingProgramme[] = [];

  for (const show of shows) {
    let best: UpcomingProgramme | null = null;
    for (const slot of show.schedule) {
      const startsAt = nextAiring(slot, now);
      if (!best || startsAt.getTime() < best.startsAt.getTime()) best = { show, slot, startsAt };
    }
    if (best) upcoming.push(best);
  }

  return upcoming.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()).slice(0, limit);
}

/** Human day label for a programme slot: "Today", "Tomorrow" or the weekday. */
export function airingDay(startsAt: Date, now = new Date()): string {
  const atMidnight = (value: Date) => new Date(value).setHours(0, 0, 0, 0);
  const days = Math.round((atMidnight(startsAt) - atMidnight(now)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return startsAt.toLocaleDateString("en-GB", { weekday: "long" });
}
