/** Semester shape shared by the academic year responses. */
export interface SemesterLike {
  year?: string | number | null;
  semester?: string | null;
}

/** "Ganjil 2026/2027": the one format for a semester label. */
export function formatSemesterLabel(academicYear: SemesterLike | null | undefined): string {
  if (!academicYear) return '-';
  const semester = academicYear.semester === 'genap' ? 'Genap' : academicYear.semester === 'ganjil' ? 'Ganjil' : '';
  return `${semester} ${academicYear.year ?? ''}`.trim() || '-';
}

/** Newest semester first: by the starting year, then Genap before Ganjil of the same year. */
export function compareSemestersDesc(a: SemesterLike, b: SemesterLike): number {
  const start = (value: SemesterLike) => Number.parseInt(String(value.year ?? '').split('/')[0], 10) || 0;
  const byYear = start(b) - start(a);
  if (byYear !== 0) return byYear;
  return (b.semester === 'genap' ? 1 : 0) - (a.semester === 'genap' ? 1 : 0);
}
