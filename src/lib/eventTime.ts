/**
 * Times of calendar events, always in WIB (Asia/Jakarta), whatever the device's time zone.
 *
 * An event time comes as:
 * - an instant with a zone ("2026-10-26T02:00:00.000Z", "...+07:00");
 * - a WIB wall-clock time without a zone ("2026-10-26T09:00:00", KP events);
 * - a date only ("2026-09-28") for an all-day event, a WIB date.
 */
export const WIB_TIME_ZONE = 'Asia/Jakarta';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

/** The instant of an event time (a date only is 00.00 WIB of that date). */
export function eventInstant(value: string | Date): Date {
  if (value instanceof Date) return value;
  if (DATE_ONLY.test(value)) return new Date(`${value}T00:00:00+07:00`);
  if (HAS_ZONE.test(value)) return new Date(value);
  return new Date(`${value}+07:00`);
}

function wibParts(value: string | Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(eventInstant(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

/** The WIB calendar day of an event time: "2026-09-28". */
export function wibDayKey(value: string | Date): string {
  if (typeof value === 'string' && DATE_ONLY.test(value)) return value;
  const p = wibParts(value);
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * For FullCalendar (which works in the device's zone): the WIB wall-clock time without a zone,
 * so an event sits on its WIB date and hour on any device. A date only stays a date only.
 */
export function toWibWallClock(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string' && DATE_ONLY.test(value)) return value;
  const p = wibParts(value);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

/** "Senin, 28 September 2026" (long) or "Sen, 28 Sep 2026" (short), in WIB. */
export function formatWibDate(value: string | Date, style: 'long' | 'short' = 'long'): string {
  // A date only is formatted at noon WIB so no zone can move it to another day.
  const instant = typeof value === 'string' && DATE_ONLY.test(value) ? new Date(`${value}T12:00:00+07:00`) : eventInstant(value);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: WIB_TIME_ZONE,
    weekday: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  }).format(instant);
}

/** "09.00" in WIB. */
export function formatWibTime(value: string | Date): string {
  const p = wibParts(value);
  return `${p.hour}.${p.minute}`;
}

/** Whole WIB days from today to the day of the event (0 = today, 1 = tomorrow). */
export function wibDaysFromToday(value: string | Date, now: Date = new Date()): number {
  const day = Date.parse(`${wibDayKey(value)}T00:00:00Z`);
  const today = Date.parse(`${wibDayKey(now)}T00:00:00Z`);
  return Math.round((day - today) / (24 * 60 * 60 * 1000));
}
