import { describe, expect, it } from 'vitest';

import { displayKelompokKeilmuanName } from './KbkLoadSummaryCard';

describe('displayKelompokKeilmuanName', () => {
  it('keeps the stored name and does not invent Sistem Informasi', () => {
    expect(displayKelompokKeilmuanName('KBK Sistem Informasi')).toBe('KBK Sistem Informasi');
    expect(displayKelompokKeilmuanName('Sistem Enterprise')).toBe('Sistem Enterprise');
  });

  it('labels unmapped lecturers without inventing a kelompok', () => {
    expect(displayKelompokKeilmuanName('Belum terpetakan')).toBe('Tanpa kelompok keilmuan');
    expect(displayKelompokKeilmuanName(null)).toBe('Tanpa kelompok keilmuan');
    expect(displayKelompokKeilmuanName('  ')).toBe('Tanpa kelompok keilmuan');
  });
});
