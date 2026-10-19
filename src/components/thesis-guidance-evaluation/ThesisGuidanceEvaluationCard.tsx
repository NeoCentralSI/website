import { useState } from 'react';
import { ClipboardCheck, Loader2 } from 'lucide-react';

import { ThesisActivityBadge } from '@/components/shared/ThesisActivityBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvaluationContext } from '@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation';
import { formatDateTimeWib } from '@/lib/text';
import { getEvaluationDueLabel, getGuidanceEvaluationStageLabel } from '@/lib/thesisLabels';
import { cn } from '@/lib/utils';
import type { ThesisGuidanceEvaluation } from '@/types/thesis-guidance-evaluation.types';
import { LecturerThesisGuidanceEvaluationFormDialog } from './LecturerThesisGuidanceEvaluationFormDialog';
import {
  ThesisGuidanceEvaluationDetailDialog,
  ThesisGuidanceEvaluationMiniTable,
} from './ThesisGuidanceEvaluationViews';

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium">{children}</div>
    </div>
  );
}

export interface ThesisGuidanceEvaluationCardProps {
  thesisId: string;
  className?: string;
}

/**
 * Compact "Evaluasi Bimbingan" on the lecturer's student detail: the current
 * state (masa bimbingan, what is due, the running warning, the evaluation waiting for the
 * department) with "Isi Evaluasi" for Pembimbing 1, then a mini history table with Detail.
 */
export function ThesisGuidanceEvaluationCard({ thesisId, className }: ThesisGuidanceEvaluationCardProps) {
  const { data: context, isLoading } = useEvaluationContext(thesisId);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<ThesisGuidanceEvaluation | null>(null);

  if (isLoading) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  if (!context || !context.thesis || !context.basis) return null;

  const isP1 = context.viewerRole === 'pembimbing_1';
  const warning = context.academicWarning;
  const open = context.openEvaluation;

  return (
    <Card className={cn('flex h-full w-full flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Evaluasi Bimbingan</CardTitle>
            <CardDescription>Evaluasi saat masa bimbingan mencapai 6 bulan dan 1 tahun, diisi oleh Pembimbing 1.</CardDescription>
          </div>
          {isP1 && (
            <span title={context.blockReason ?? undefined}>
              <Button size="sm" disabled={!context.canSubmit} onClick={() => setFormOpen(true)}>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Isi Evaluasi
              </Button>
            </span>
          )}
        </div>
        {isP1 && context.blockReason && (
          <p className="text-xs text-muted-foreground">Isi Evaluasi belum tersedia: {context.blockReason}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Fact label="Masa bimbingan">{context.basis.elapsedLabel}</Fact>
          <Fact label="Aktivitas"><ThesisActivityBadge level={context.basis.activityLevel} /></Fact>
          <Fact label="Jatuh tempo">
            {context.stage ? <Badge variant="warning">{getEvaluationDueLabel(context.stage)}</Badge> : 'Tidak ada'}
          </Fact>
        </div>
        {warning && (
          <p className="text-sm text-amber-800">
            Peringatan akademik: perpanjangan 1 bulan sampai {formatDateTimeWib(warning.extensionUntil)}.
            {warning.followUpDue ? ' Batas itu sudah lewat; tindak lanjut perlu diisi.' : ''}
          </p>
        )}
        {open && (
          <p className="text-sm">
            {getGuidanceEvaluationStageLabel(open.stage)} menunggu keputusan Ketua Departemen{' · '}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => setDetail(open)}>
              Lihat detail
            </button>
          </p>
        )}
        <div className="space-y-2">
          <p className="text-sm font-medium">Riwayat</p>
          <ThesisGuidanceEvaluationMiniTable evaluations={context.history} onDetail={setDetail} />
        </div>
      </CardContent>

      {isP1 && <LecturerThesisGuidanceEvaluationFormDialog open={formOpen} onOpenChange={setFormOpen} context={context} />}
      <ThesisGuidanceEvaluationDetailDialog evaluation={detail} onClose={() => setDetail(null)} />
    </Card>
  );
}
