import { ThesisChangeRequestCard } from './ThesisChangeRequestCard';

/**
 * Supervisor's student detail: change requests of one thesis. "Ajukan Perubahan" is for
 * Pembimbing 1; the backend tells Pembimbing 2 to use the "Alihkan" action of Mahasiswa
 * Bimbingan instead.
 */
export function LecturerThesisChangeRequestCard({ thesisId, className }: { thesisId: string; className?: string }) {
  return <ThesisChangeRequestCard thesisId={thesisId} className={className} />;
}
