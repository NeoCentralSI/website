import { describe, expect, it } from 'vitest';
import { eventInstant, formatWibDate, formatWibTime, toWibWallClock, wibDayKey, wibDaysFromToday } from './eventTime';

// These hold in every device time zone (CI runs in UTC, the app is used in WIB).
describe('event times in WIB', () => {
  it('an all-day date stays its WIB date', () => {
    expect(formatWibDate('2026-09-28')).toBe('Senin, 28 September 2026');
    expect(toWibWallClock('2026-09-28')).toBe('2026-09-28');
    expect(wibDayKey('2026-09-28')).toBe('2026-09-28');
  });

  it('an instant is shown at its WIB date and hour', () => {
    // 20.00 UTC on the 27th is 03.00 WIB on the 28th.
    expect(formatWibDate('2026-09-27T20:00:00.000Z', 'short')).toBe('Sen, 28 Sep 2026');
    expect(formatWibTime('2026-09-27T20:00:00.000Z')).toBe('03.00');
    expect(toWibWallClock('2026-09-27T20:00:00.000Z')).toBe('2026-09-28T03:00:00');
  });

  it('a wall-clock time without a zone is read as WIB (KP events)', () => {
    expect(eventInstant('2026-10-26T09:00:00').toISOString()).toBe('2026-10-26T02:00:00.000Z');
    expect(toWibWallClock('2026-10-26T09:00:00')).toBe('2026-10-26T09:00:00');
  });

  it('counts WIB days from today', () => {
    const now = new Date('2026-10-26T18:00:00.000Z'); // 01.00 WIB on the 27th
    expect(wibDaysFromToday('2026-10-27T03:00:00.000Z', now)).toBe(0);
    expect(wibDaysFromToday('2026-10-28', now)).toBe(1);
  });
});
