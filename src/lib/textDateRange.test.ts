import { describe, expect, it } from 'vitest';
import { formatDateAbbrId, formatDateRangeShort } from './text';

describe('short dates for narrow table cells', () => {
  it('formats a range in one year without repeating the year', () => {
    expect(formatDateRangeShort('2026-10-24T03:00:00Z', '2026-11-08T03:00:00Z')).toBe('24 Okt – 8 Nov 2026');
  });
  it('keeps both years across a year end and handles missing ends', () => {
    expect(formatDateRangeShort('2026-12-28T03:00:00Z', '2027-01-05T03:00:00Z')).toBe('28 Des 2026 – 5 Jan 2027');
    expect(formatDateRangeShort(null, '2026-11-08T03:00:00Z')).toBe('8 Nov 2026');
    expect(formatDateRangeShort(null, null)).toBe('-');
    expect(formatDateAbbrId('2026-10-24T20:00:00Z')).toBe('25 Okt 2026');
  });
});
