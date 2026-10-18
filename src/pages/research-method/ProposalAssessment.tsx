import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { ExportButtons } from '@/components/research-method/ExportButtons';
import { PeriodSelect } from '@/components/research-method/PeriodSelect';
import { ProposalAssessmentTable } from '@/components/research-method/ProposalAssessmentTable';
import { PageHeading } from '@/components/shared/PageHeading';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useCoordinatorQueue } from '@/hooks/research-method/useResearchMethod';
import { useRole } from '@/hooks/shared/useRole';

/**
 * Metode Penelitian > Penilaian Proposal (koordinator; Paket P8): setiap percobaan periode yang
 * sudah berproposal final, nilai pembimbing dan koordinator, hasil, serta ekspor rekap nilai
 * (format templat SIA) dan daftar judul TA yang lulus. Kadep, Sekdep, dan Admin membaca.
 */
export default function ProposalAssessment() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isResearchMethodCoordinator } = useRole();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const queue = useCoordinatorQueue(academicYearId);
  const yearId = academicYearId ?? queue.data?.academicYear.id ?? null;

  useEffect(() => {
    setBreadcrumbs([{ label: 'Metode Penelitian' }, { label: 'Penilaian Proposal' }]);
    setTitle('Penilaian Proposal');
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <PageHeading title="Penilaian Proposal" subtitle="Nilai koordinator untuk setiap proposal final; nilai akhir adalah jumlah nilai pembimbing dan nilai koordinator" />
        {queue.data && (
          <p className="text-sm text-muted-foreground">
            Lulus bila presensi minimal 75% dan nilai akhir minimal {queue.data.minimumScore} ({queue.data.academicYear.label}).
          </p>
        )}
      </div>

      {queue.error ? (
        <p className="text-sm text-destructive">{queue.error instanceof Error ? queue.error.message : 'Gagal memuat data.'}</p>
      ) : (
        <ProposalAssessmentTable
          party="coordinator"
          queue={queue.data}
          isLoading={queue.isLoading}
          isFetching={queue.isFetching}
          viewerCanScore={isResearchMethodCoordinator()}
          viewerBlockReason="Hanya Koordinator Metode Penelitian yang mengisi nilai koordinator."
          emptyText="Belum ada proposal final pada periode ini."
          actions={
            <>
              <PeriodSelect value={yearId} onChange={setAcademicYearId} />
              <ExportButtons academicYearId={yearId} />
              <RefreshButton onClick={() => void queue.refetch()} isRefreshing={queue.isFetching && !queue.isLoading} />
            </>
          }
        />
      )}
    </div>
  );
}
