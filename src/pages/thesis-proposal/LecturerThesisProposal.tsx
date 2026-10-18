import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { PeriodSelect } from '@/components/research-method/PeriodSelect';
import { ProposalAssessmentTable } from '@/components/research-method/ProposalAssessmentTable';
import { PageHeading } from '@/components/shared/PageHeading';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useSupervisorQueue } from '@/hooks/research-method/useResearchMethod';

/**
 * Tugas Akhir > Proposal (dosen pembimbing, rencana bagian 6; Paket P8): mahasiswa bimbingan fase
 * proposal per periode, proposal final, presensi, dan "Nilai Proposal". Pembimbing 1 normalnya
 * mengisi; Pembimbing 2 boleh mengisi sebagai cadangan (K9). Nilai terkunci setelah dikirim.
 */
export default function LecturerThesisProposal() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const queue = useSupervisorQueue(academicYearId);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Tugas Akhir' }, { label: 'Proposal' }]);
    setTitle('Proposal');
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <PageHeading title="Proposal" subtitle="Mahasiswa bimbingan fase proposal dan Penilaian Proposal oleh pembimbing" />
        {queue.data && (
          <p className="text-sm text-muted-foreground">
            Nilai minimum lulus {queue.data.academicYear.label}: {queue.data.minimumScore}. Nilai diisi setelah mahasiswa mengajukan proposal final dan presensi kelas tersedia.
          </p>
        )}
      </div>

      {queue.error ? (
        <p className="text-sm text-destructive">{queue.error instanceof Error ? queue.error.message : 'Gagal memuat data.'}</p>
      ) : (
        <ProposalAssessmentTable
          party="supervisor"
          queue={queue.data}
          isLoading={queue.isLoading}
          isFetching={queue.isFetching}
          viewerCanScore
          emptyText="Belum ada mahasiswa bimbingan fase proposal pada periode ini."
          studentHref={(row) => `/tugas-akhir/bimbingan/lecturer/my-students/${row.thesis.id}`}
          actions={
            <>
              <PeriodSelect value={academicYearId ?? queue.data?.academicYear.id} onChange={setAcademicYearId} />
              <RefreshButton onClick={() => void queue.refetch()} isRefreshing={queue.isFetching && !queue.isLoading} />
            </>
          }
        />
      )}
    </div>
  );
}
