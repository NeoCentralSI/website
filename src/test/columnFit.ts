import { expect } from 'vitest';

/**
 * The longest text each badge or date column can show, measured in Inter (badge:
 * label at 12 px semibold + 22 px of padding and border; date: 14 px regular) plus the cell's
 * 24 px of padding. A column must be at least this wide.
 */
export const MEASURED_MIN_WIDTH: Record<string, number> = {
  'Menunggu Penetapan Penguji': 220,
  'Menunggu Keputusan Anda': 208,
  'Menunggu Persetujuan Anda': 215,
  'Perubahan Judul & Pembimbing': 231,
  'Judul dan Pembimbing': 179,
  'Menunggu Persetujuan': 181,
  'Menunggu Kadep': 149,
  'Berhenti Studi Sementara (BSS)': 229,
  '30 September 2026': 157,
  '11 September 2026': 151,
  // Proposal and Research Method tables
  'Menunggu Pembimbing': 184,
  'Menunggu Koordinator': 181,
  'Belum Ada Pembimbing': 184,
  'Sudah Ditetapkan': 149,
  'Belum Ditetapkan': 148,
  'Digantikan': 108,
  '99/99 · Mendekati Batas': 188,
  'Ditutup Dosen': 128,
  'Menunggu Periode Berikutnya': 222,
  'Di Bawah 75%': 129,
  'Tidak Lulus': 113,
  // Penetapan panel
  'Jalur Departemen · Menunggu Keputusan': 288,
  'Di Atas Kuota · Menunggu Keputusan': 263,
  'Pembimbing 2 · Menunggu Keputusan': 268,
  'Ditetapkan (versi 12)': 166,
};

/**
 * The column of `header` is at least as wide as `text` needs, and the cell that shows it clips
 * its content (`overflow-hidden`) instead of letting it run into the next cell.
 */
export function expectColumnFits(header: HTMLElement, cell: HTMLElement, text: string) {
  const need = MEASURED_MIN_WIDTH[text];
  if (need === undefined) throw new Error(`No measured width for "${text}"`);
  expect(cell).toHaveTextContent(text);
  expect(Number.parseFloat(header.style.width)).toBeGreaterThanOrEqual(need);
  expect(cell.className).toContain('overflow-hidden');
}
