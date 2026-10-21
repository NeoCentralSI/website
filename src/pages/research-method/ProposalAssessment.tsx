import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { PeriodSelect } from '@/components/research-method/PeriodSelect';
import { ProposalAssessmentTable } from '@/components/research-method/ProposalAssessmentTable';
import { PageHeading } from '@/components/shared/PageHeading';
import { Badge } from '@/components/ui/badge';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useCoordinatorQueue } from '@/hooks/research-method/useResearchMethod';

/**
 * Metode Penelitian > Penilaian Proposal, for the Koordinator Metode Penelitian only: every attempt
 * of the semester with a final proposal, both parties' sent scores and the result. The coordinator
 * scores on the score page of the attempt. Kadep and Sekdep follow the class in Monitoring Kelas.
 * Toolbar: search, minimum score, semester, Muat Ulang.
 */
export default function ProposalAssessment() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const queue = useCoordinatorQueue(academicYearId);
  const yearId = academicYearId ?? queue.data?.academicYear.id ?? null;

  useEffect(() => {
    setBreadcrumbs([{ label: 'Metode Penelitian' }, { label: 'Penilaian Proposal' }]);
    setTitle('Penilaian Proposal');
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Penilaian Proposal" subtitle="Nilai koordinator untuk setiap proposal final" />

      {queue.error ? (
        <p className="text-sm text-destructive">{queue.error instanceof Error ? queue.error.message : 'Gagal memuat data.'}</p>
      ) : (
        <ProposalAssessmentTable
          party="coordinator"
          queue={queue.data}
          isLoading={queue.isLoading}
          isFetching={queue.isFetching}
          viewerCanScore
          emptyText="Belum ada proposal final pada semester ini."
          actions={
            <>
              {queue.data && (
                <Badge variant="outline" className="h-8 whitespace-nowrap px-3 text-sm font-medium" title="Lulus bila nilai akhir (pembimbing + koordinator) mencapai nilai minimum; tugas akhir langsung masuk fase Penelitian">
                  Nilai minimum: {queue.data.minimumScore}
                </Badge>
              )}
              <PeriodSelect value={yearId} onChange={setAcademicYearId} />
              <RefreshButton onClick={() => void queue.refetch()} isRefreshing={queue.isFetching && !queue.isLoading} />
            </>
          }
        />
      )}
    </div>
  );
}
