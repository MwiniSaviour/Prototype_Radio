import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractSchedule,
  resolveCurrentSlot,
  rollingWindow,
  toMinutes,
  type SlotOccurrence,
  type Weekday,
} from "../src/lib/resolveCurrentSlot";

// Local dates: 2026-10-17 is a Saturday — the anchor for every fixed `now` case.
const SAT_1000 = new Date(2026, 9, 17, 10, 0);
const SAT_1030 = new Date(2026, 9, 17, 10, 30);
const SAT_1100 = new Date(2026, 9, 17, 11, 0);
const SAT_1200 = new Date(2026, 9, 17, 12, 0);
const SAT_2300 = new Date(2026, 9, 17, 23, 0);
const SAT_2330 = new Date(2026, 9, 17, 23, 30);

interface Slot {
  id: string;
  start: string;
  end: string;
}

const item = (id: string, start: string, end: string): Slot => ({ id, start, end });

const EMPTY: Record<Weekday, readonly Slot[]> = {
  sunday: [],
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
};

const only = (
  partial: Partial<Record<Weekday, Slot[]>>,
): Record<Weekday, readonly Slot[]> => ({ ...EMPTY, ...partial });

const firstId = (occ: SlotOccurrence<Slot> | null): string | null => occ?.item.id ?? null;
const ids = (occurrences: readonly SlotOccurrence<Slot>[]): (string | null)[] =>
  occurrences.map((row) => row.item.id);

test("toMinutes maps H:MM and HH:MM", () => {
  assert.equal(toMinutes("0:00"), 0);
  assert.equal(toMinutes("9:30"), 570);
  assert.equal(toMinutes("10:30"), 630);
  assert.equal(toMinutes("23:59"), 1439);
});

test('toMinutes maps "24:00" to 1440', () => {
  assert.equal(toMinutes("24:00"), 1440);
});

test("toMinutes rejects invalid forms and ranges", () => {
  assert.throws(() => toMinutes("24:30"), RangeError);
  assert.throws(() => toMinutes("25:00"), RangeError);
  assert.throws(() => toMinutes("10:75"), RangeError);
  assert.throws(() => toMinutes("7:5"), RangeError);
  assert.throws(() => toMinutes(""), RangeError);
  assert.throws(() => toMinutes("10:0a"), RangeError);
});

test("extractSchedule emits today rows then tomorrow rows with offsets", () => {
  const satMorning = item("sat-morning", "10:00", "12:00");
  const sunMorning = item("sun-morning", "08:00", "09:00");
  const schedule = only({ saturday: [satMorning], sunday: [sunMorning] });

  assert.deepEqual(extractSchedule(schedule, SAT_1030), [
    {
      item: satMorning,
      day: "saturday",
      start: "10:00",
      end: "12:00",
      startMinutes: 600,
      endMinutes: 720,
      isToday: true,
    },
    {
      item: sunMorning,
      day: "sunday",
      start: "08:00",
      end: "09:00",
      startMinutes: 1920,
      endMinutes: 1980,
      isToday: false,
    },
  ]);
});

test("midnight-crossing slot ends at start + 1440 and can be live", () => {
  const crossing = item("sat-late", "23:00", "01:00");
  const schedule = only({ saturday: [crossing] });

  assert.deepEqual(extractSchedule(schedule, SAT_1030), [
    {
      item: crossing,
      day: "saturday",
      start: "23:00",
      end: "01:00",
      startMinutes: 1380,
      endMinutes: 1500,
      isToday: true,
    },
  ]);

  const { live, next, anchorIsLive } = resolveCurrentSlot(schedule, SAT_2330);
  assert.equal(firstId(live), "sat-late");
  assert.equal(firstId(next), null);
  assert.equal(anchorIsLive, true);
});

test('a "24:00" end keeps minute 1440 and stays live at 23:30', () => {
  const schedule = only({ saturday: [item("sat-late", "23:00", "24:00")] });
  const [row] = extractSchedule(schedule, SAT_1030);
  assert.ok(row);
  assert.equal(row.startMinutes, 1380);
  assert.equal(row.endMinutes, 1440);

  const { live, anchorIsLive } = resolveCurrentSlot(schedule, SAT_2330);
  assert.equal(firstId(live), "sat-late");
  assert.equal(anchorIsLive, true);
});

test("live is found mid-slot and next is null without later starts", () => {
  const schedule = only({ saturday: [item("sat-morning", "10:00", "12:00")] });
  const { live, next, anchorIsLive } = resolveCurrentSlot(schedule, SAT_1030);
  assert.equal(firstId(live), "sat-morning");
  assert.ok(live);
  assert.equal(live.isToday, true);
  assert.equal(live.day, "saturday");
  assert.equal(firstId(next), null);
  assert.equal(anchorIsLive, true);
});

test("a slot is live from its exact start minute", () => {
  const schedule = only({ saturday: [item("sat-morning", "10:00", "12:00")] });
  const { live, next, anchorIsLive } = resolveCurrentSlot(schedule, SAT_1000);
  assert.equal(firstId(live), "sat-morning");
  assert.equal(firstId(next), null);
  assert.equal(anchorIsLive, true);
});

test("at the exact end minute the slot is over and next picks a later slot", () => {
  const schedule = only({
    saturday: [item("sat-a", "10:00", "12:00"), item("sat-b", "14:00", "15:00")],
  });
  const { live, next, anchorIsLive } = resolveCurrentSlot(schedule, SAT_1200);
  assert.equal(firstId(live), null);
  assert.equal(firstId(next), "sat-b");
  assert.ok(next);
  assert.equal(next.startMinutes, 840);
  assert.equal(anchorIsLive, false);
});

test("when today is done, next is the first tomorrow occurrence", () => {
  const schedule = only({
    saturday: [item("sat-a", "08:00", "10:00")],
    sunday: [item("sun-a", "12:00", "13:00")],
  });
  const { live, next, anchorIsLive } = resolveCurrentSlot(schedule, SAT_1030);
  assert.equal(firstId(live), null);
  assert.equal(firstId(next), "sun-a");
  assert.ok(next);
  assert.equal(next.day, "sunday");
  assert.equal(next.isToday, false);
  assert.equal(next.startMinutes, 1440 + 720);
  assert.equal(anchorIsLive, false);
});

test("an empty schedule resolves to nulls and an empty window", () => {
  const schedule = only({});
  const result = resolveCurrentSlot(schedule, SAT_1030);
  assert.equal(firstId(result.live), null);
  assert.equal(firstId(result.next), null);
  assert.equal(result.anchorIsLive, false);

  const win = rollingWindow(schedule, SAT_1030, 3);
  assert.deepEqual(win.occurrences, []);
  assert.equal(win.anchorIsLive, false);
});

test("rows on unrelated weekdays do not appear in today or tomorrow", () => {
  const schedule = only({ monday: [item("mon-a", "09:00", "10:00")] });
  const result = resolveCurrentSlot(schedule, SAT_1030);
  assert.equal(firstId(result.live), null);
  assert.equal(firstId(result.next), null);
});

test("slots starting at the same minute keep listing order and take turns", () => {
  const a = item("sat-a", "14:00", "15:00");
  const b = item("sat-b", "14:00", "16:00");
  const schedule = only({ saturday: [a, b] });

  assert.deepEqual(
    ids(extractSchedule(schedule, SAT_1030)),
    ["sat-a", "sat-b"],
  );
  const { next } = resolveCurrentSlot(schedule, SAT_1030);
  assert.equal(firstId(next), "sat-a");
});

test("rolling window anchors at the live slot and slices forward", () => {
  const schedule = only({
    saturday: [
      item("sat-a", "10:00", "12:00"),
      item("sat-b", "13:00", "14:00"),
      item("sat-c", "15:00", "16:00"),
    ],
    sunday: [item("sun-a", "09:00", "10:00")],
  });
  const { occurrences, anchorIsLive } = rollingWindow(schedule, SAT_1100, 3);
  assert.deepEqual(ids(occurrences), ["sat-a", "sat-b", "sat-c"]);
  assert.equal(anchorIsLive, true);
});

test("rolling window truncates when fewer rows remain than requested", () => {
  const schedule = only({
    saturday: [item("sat-a", "08:00", "10:00")],
    sunday: [item("sun-a", "09:00", "10:00")],
  });
  const { occurrences, anchorIsLive } = rollingWindow(schedule, SAT_1030, 5);
  assert.deepEqual(ids(occurrences), ["sun-a"]);
  assert.equal(anchorIsLive, false);
});

test("rolling window falls back to the first row when nothing is live or next", () => {
  const schedule = only({ saturday: [item("sat-a", "08:00", "10:00")] });
  const { occurrences, anchorIsLive } = rollingWindow(schedule, SAT_2300, 6);
  assert.deepEqual(ids(occurrences), ["sat-a"]);
  assert.equal(anchorIsLive, false);
});

test("rolling window continues across tomorrow rows in order", () => {
  const schedule = only({
    saturday: [item("sat-a", "10:00", "12:00"), item("sat-b", "13:00", "14:00")],
    sunday: [item("sun-a", "08:00", "09:00")],
  });
  const { occurrences, anchorIsLive } = rollingWindow(schedule, SAT_1100, 3);
  assert.deepEqual(ids(occurrences), ["sat-a", "sat-b", "sun-a"]);
  assert.equal(occurrences[2]?.day, "sunday");
  assert.equal(anchorIsLive, true);
});
