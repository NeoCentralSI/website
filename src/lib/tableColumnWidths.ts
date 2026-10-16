/**
 * Paket E6 (1): no cell content may leave its cell. A column that holds a badge or a date is at
 * least as wide as the longest text it can show, and clips (`CLIP_CELL`) if it still does not
 * fit; free text (titles, summaries) is the column that narrows. Widths were measured in Inter:
 * a badge is its label at 12 px semibold plus `px-2.5` and the border (22 px), a cell adds
 * `px-3` (24 px); a date is "30 September 2026" at 14 px.
 */
export const CLIP_CELL = 'overflow-hidden';

/** "30 September 2026" (the longest day-month-year) needs 157 px. */
export const DATE_COLUMN_WIDTH = 160;

/** Aksi with three icons (`h-8 w-8`, `gap-1`): 104 px of icons. */
export const ACTIONS_3_WIDTH = 128;

/** Longest badge of each column, in px (measured), and the width given to the column. */
export const BADGE_COLUMN_WIDTH = {
  /** Monitoring Seminar Hasil/Sidang, "Menunggu Penetapan Penguji": 220. */
  thesisEventStatus: 228,
  /** Evaluasi and Perubahan (Kadep), "Menunggu Keputusan Anda": 208. */
  decisionStatus: 216,
  /** Permohonan, "Menunggu Persetujuan Anda": 215. */
  lecturerInboxStatus: 222,
  /** Permohonan, "Perubahan Judul & Pembimbing": 231. */
  lecturerInboxJenis: 236,
  /** Perubahan (Kadep), "Judul dan Pembimbing": 179. */
  changeKind: 186,
  /** Tabel mini evaluasi, "Menunggu Kadep": 149. */
  evaluationMiniStatus: 152,
  /** Tabel mini perubahan, jenis and status stacked, "Menunggu Persetujuan": 181. */
  changeMiniKindStatus: 188,
} as const;

/** Mahasiswa Bimbingan: "Berhenti Studi Sementara (BSS)" in the Mahasiswa column needs 229 px. */
export const MY_STUDENTS_NAME_MIN_WIDTH = 232;
