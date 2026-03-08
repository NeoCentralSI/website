import LecturerSeminarDetailIdentity from './LecturerSeminarDetailIdentity';

/**
 * Default lecturer seminar detail page.
 * Shows the identity/read-only view when the seminar is not ongoing
 * or the lecturer doesn't have examiner/supervisor actions.
 *
 * Note:
 * - Examiner action tab label: Penilaian
 * - Catatan penguji ditampilkan di kartu rekap penguji pada halaman penilaian
 * - Supervisor action tab label: Berita Acara
 */
export default function LecturerSeminarDetailPage() {
  return <LecturerSeminarDetailIdentity />;
}
