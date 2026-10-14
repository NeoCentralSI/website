import { useState } from 'react';

import { MinimumScoreDialog } from '@/components/master-data/MinimumScoreDialog';
import { Button } from '@/components/ui/button';
import { useAssessmentForm, useSetMinimumScore } from '@/hooks/research-method/useResearchMethod';

/**
 * Nilai minimum lulus Metode Penelitian per periode (rencana 10.2), sejajar dengan nilai minimum
 * seminar dan sidang. Sekdep mengubahnya; koordinator membaca.
 */
export function ResearchMethodMinimumScoreCard({ academicYearId, canEdit }: { academicYearId?: string; canEdit: boolean }) {
  const { data } = useAssessmentForm('supervisor', academicYearId, Boolean(academicYearId));
  const save = useSetMinimumScore();
  const [open, setOpen] = useState(false);
  const reason = canEdit ? null : 'Nilai minimum lulus diatur Sekretaris Departemen.';
  if (!academicYearId || !data) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm">
      <span>
        Nilai minimum lulus Metode Penelitian {data.academicYear.label}: <strong>{data.minimumScore}</strong>
        <span className="text-muted-foreground"> · lulus bila presensi minimal 75% dan nilai akhir mencapai nilai ini</span>
      </span>
      <span title={reason ?? undefined}>
        <Button variant="outline" size="sm" disabled={!canEdit} onClick={() => setOpen(true)}>Ubah</Button>
      </span>
      <MinimumScoreDialog
        open={open}
        onOpenChange={setOpen}
        currentScore={data.minimumScore}
        isLoading={save.isPending}
        onSubmit={(minimumScore) => save.mutate({ academicYearId, minimumScore }, { onSuccess: () => setOpen(false) })}
      />
    </div>
  );
}
