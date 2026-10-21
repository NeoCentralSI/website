/**
 * No cell content may leave its cell. A column that holds a badge or a date is at
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
  /** Penilaian Proposal (pembimbing, koordinator), "Menunggu Pembimbing": 184. */
  proposalAssessmentStatus: 188,
  /** Monitoring Kelas, "Belum Ada Pembimbing": 184. */
  researchMethodStage: 188,
  /** Susunan Penetapan Pembimbing, "Sudah Ditetapkan": 149. */
  assignmentEntryStatus: 152,
  /** Riwayat versi penetapan, "Digantikan": 108. */
  assignmentBatchStatus: 112,
  /** Beban dosen, "99/99 · Mendekati Batas": 188. */
  supervisionLoad: 192,
  /** Beban dosen, header "Pengajuan Baru" with its filter; "Ditutup Dosen": 128. */
  acceptingRequests: 150,
  /** Riwayat pengajuan mahasiswa (label pendek), "Menunggu Kadep": 149. */
  supervisorRequestShortStatus: 152,
  /** Riwayat percobaan penilaian, "Tidak Lulus" / "Belum Final": 113. */
  researchMethodResult: 120,
} as const;

/**
 * Beban Dosen, one number column per stage; each fits its header (14 px semibold +
 * the cell padding): "Menunggu Penetapan" 173, "Proposal" 84, "Penelitian" 91, "BSS" 52,
 * "Pembimbing 2" 121.
 */
export const LOAD_COUNT_COLUMN_WIDTH = {
  waitingAssignment: 176,
  proposal: 88,
  research: 96,
  onLeave: 64,
  asSupervisor2: 124,
} as const;

/**
 * Penetapan, one table. "Jalur Departemen · Menunggu Keputusan" 288 and
 * "Ditetapkan (versi 12)" 166 (badges, measured in Inter).
 */
export const ASSIGNMENT_BOARD_WIDTH = {
  submission: 292,
  assignment: 168,
} as const;

/** Mahasiswa Bimbingan: "Berhenti Studi Sementara (BSS)" in the Mahasiswa column needs 229 px. */
export const MY_STUDENTS_NAME_MIN_WIDTH = 232;
