/**
 * Once a semester has any Penilaian Proposal detail (a draft or a sent score), its CPMK, criteria
 * and rubrics stay: they cannot be deleted, and the maximum score of a criterion and the ranges of
 * its rubrics cannot change (names and descriptions still can). The minimum passing score locks once
 * the semester has a final result. The server refuses with the same words.
 */
export const LOCKED_DELETE_REASON = 'Penilaian proposal semester ini sudah dimulai; CPMK, kriteria, dan rubrik tidak dapat dihapus.';
export const LOCKED_SCORE_REASON = 'Penilaian proposal semester ini sudah dimulai; skor maksimum kriteria dan rentang rubrik tidak dapat diubah.';
export const LOCKED_MINIMUM_REASON = 'Nilai minimum lulus terkunci karena sudah ada hasil penilaian final pada semester ini.';
