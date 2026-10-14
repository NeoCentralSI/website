import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAttendance } from '@/components/research-method/AssessmentCells';
import { useMyProposalOverview } from '@/hooks/thesis-proposal/useSupervisorAssignment';
import { getResearchMethodResultLabel, getResearchMethodResultVariant } from '@/lib/thesisLabels';
import type { FinalProposalAttempt } from '@/types/thesis-proposal.types';

/** What the student reads about the current attempt (scores only once final). */
export function describeAttempt(attempt: FinalProposalAttempt | null): string {
  if (!attempt?.file) return 'Penilaian dimulai setelah proposal final diajukan.';
  if (attempt.attendanceAutoZeroed) return 'Presensi kelas Metode Penelitian di bawah 75%, sehingga nilai otomatis 0. Anda mengulang pada periode berikutnya.';
  if (attempt.isFinalized) {
    return attempt.result === 'passed'
      ? 'Lulus. Anda naik ke fase Penelitian setelah KRS Tugas Akhir terkonfirmasi di SIA pada periode berikutnya.'
      : 'Tidak lulus. Anda mengulang Metode Penelitian pada periode berikutnya dengan pembimbing dan judul yang sama.';
  }
  const done = [attempt.supervisorScored && 'pembimbing', attempt.coordinatorScored && 'koordinator'].filter(Boolean);
  return done.length ? `Nilai ${done.join(' dan ')} sudah masuk. Nilai akhir tampil setelah kedua penilai mengirim.` : 'Menunggu penilaian pembimbing dan koordinator.';
}

/**
 * Bagian "Nilai Metode Penelitian" di Tugas Akhir > Proposal: status penilaian percobaan
 * periode berjalan, presensi, nilai akhir dan hasilnya (lulus bila presensi minimal 75% dan
 * nilai akhir mencapai nilai minimum periode).
 */
export function StudentResearchMethodScoreSection() {
  const { data } = useMyProposalOverview();
  if (!data?.thesis) return null;
  const { current, academicYear } = data.finalProposal;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Nilai Metode Penelitian
          {current?.isFinalized && current.result && (
            <Badge variant={getResearchMethodResultVariant(current.result)}>{getResearchMethodResultLabel(current.result)}</Badge>
          )}
        </CardTitle>
        <CardDescription>{describeAttempt(current)}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Periode</dt>
            <dd className="font-medium">{current?.academicYear.label ?? academicYear?.label ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Presensi</dt>
            <dd className={current?.attendance && !current.attendance.isEligible ? 'font-medium text-destructive' : 'font-medium'}>
              {current?.attendance ? formatAttendance(current.attendance.attendancePercentage) : 'Belum tercatat'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Nilai Akhir</dt>
            <dd className="font-medium">{current?.isFinalized ? current.finalScore : 'Belum final'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Nilai Minimum Lulus</dt>
            <dd className="font-medium">{current?.minimumScore ?? '-'}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
