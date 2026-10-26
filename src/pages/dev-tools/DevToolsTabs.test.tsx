import { describe, expect, it, vi } from 'vitest';

vi.mock('lottie-react', () => ({ default: () => null }));

import { devToolsTabOf } from './DevTools';

describe('DevTools tabs', () => {
  it('match per whole segment: Periode does not light up on Periode Yudisium', () => {
    expect(devToolsTabOf('/admin/dev-tools/periode-yudisium').label).toBe('Periode Yudisium');
    expect(devToolsTabOf('/admin/dev-tools/periode').label).toBe('Periode');
    expect(devToolsTabOf('/admin/dev-tools/peserta-yudisium').label).toBe('Peserta Yudisium');
    expect(devToolsTabOf('/admin/dev-tools/seminar').label).toBe('Seminar Hasil');
  });
});
