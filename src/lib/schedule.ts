import type { Group, Slot, Weekday } from '@/lib/api/types';

// Class times from the API are wall-clock times at the school. Tashkent is
// UTC+5 all year (no daylight saving), so the arithmetic below works in that
// offset directly and gives the right answer whatever the phone's time zone.
const SCHOOL_UTC_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const SHORT: Record<Weekday, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};
const LONG: Record<Weekday, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};
const ORDER: Record<Weekday, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };

export function formatWeekdays(days: Weekday[]): string {
  return [...days].sort((a, b) => ORDER[a] - ORDER[b]).map((d) => SHORT[d]).join(' · ');
}

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Midnight at the school, as a UTC timestamp, for the school-day containing t.
function schoolMidnight(t: number): number {
  const local = t + SCHOOL_UTC_OFFSET_MS;
  return local - (local % DAY_MS) - SCHOOL_UTC_OFFSET_MS;
}

function dateKey(midnight: number): string {
  return new Date(midnight + SCHOOL_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

export type Occurrence = {
  group: Group;
  slot: Slot;
  start: number;
  end: number;
};

// The class happening now or next, looking a week ahead.
export function nextClass(groups: Group[], now: number): Occurrence | null {
  let best: Occurrence | null = null;
  const today = schoolMidnight(now);
  for (let offset = 0; offset < 8; offset++) {
    const day = today + offset * DAY_MS;
    const weekday = WEEKDAYS[new Date(day + SCHOOL_UTC_OFFSET_MS).getUTCDay()];
    const key = dateKey(day);
    for (const group of groups) {
      for (const slot of group.schedule) {
        if (!slot.weekdays.includes(weekday)) continue;
        if (slot.begin_date && key < slot.begin_date) continue;
        if (slot.end_date && key > slot.end_date) continue;
        const start = day + minutes(slot.begin_time) * 60_000;
        const end = day + minutes(slot.end_time) * 60_000;
        if (end <= now) continue;
        if (!best || start < best.start) best = { group, slot, start, end };
      }
    }
    if (best) return best;
  }
  return null;
}

/** "Now", "Today", "Tomorrow" or the weekday name. */
export function describeDay(start: number, now: number): string {
  if (start <= now) return 'Now';
  const days = Math.round((schoolMidnight(start) - schoolMidnight(now)) / DAY_MS);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return LONG[WEEKDAYS[new Date(start + SCHOOL_UTC_OFFSET_MS).getUTCDay()]];
}
