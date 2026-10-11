import { useState } from 'react';
import { AlertTriangle, ClipboardCheck, Loader2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { ThesisActivityBadge } from '@/components/shared/ThesisActivityBadge';
import { useEvaluationContext } from '@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation';
import { formatDateTimeWib } from '@/lib/text';
import { getEvaluationDueLabel } from '@/lib/thesisLabels';
import { cn } from '@/lib/utils';
import { LecturerThesisGuidanceEvaluationFormDialog } from './LecturerThesisGuidanceEvaluationFormDialog';
import { ThesisGuidanceEvaluationSummary } from './ThesisGuidanceEvaluationParts';

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium">{children}</div>
    </div>
  );
}

export interface ThesisGuidanceEvaluationCardProps {
  /** Omitted = the signed-in student's own thesis. */
  thesisId?: string;
  className?: string;
}

/**
 * "Evaluasi Bimbingan": supervision time, activity, completed sessions, what is due, the
 * running academic warning, the evaluation waiting for a decision and the history. Only
 * Pembimbing 1 gets "Isi Evaluasi"; when it is disabled its reason is shown.
 */
export function ThesisGuidanceEvaluationCard({ thesisId, className }: ThesisGuidanceEvaluationCardProps) {
  const { data: context, isLoading } = useEvaluationContext(thesisId);
  const [formOpen, setFormOpen] = useState(false);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  if (!context || !context.thesis || !context.basis) return null;

  const isP1 = context.viewerRole === 'pembimbing_1';
  const warning = context.academicWarning;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Evaluasi Bimbingan</CardTitle>
            <CardDescription>
              Evaluasi saat masa bimbingan mencapai 6 bulan dan 1 tahun, diisi oleh Pembimbing 1.
            </CardDescription>
          </div>
          {isP1 && (
            <Button disabled={!context.canSubmit} onClick={() => setFormOpen(true)}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Isi Evaluasi
            </Button>
          )}
        </div>
        {isP1 && context.blockReason && (
          <p className="text-xs text-muted-foreground">Isi Evaluasi belum tersedia: {context.blockReason}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Masa bimbingan">{context.basis.elapsedLabel}</Fact>
          <Fact label="Aktivitas"><ThesisActivityBadge level={context.basis.activityLevel} /></Fact>
          <Fact label="Sesi bimbingan selesai">{context.basis.guidanceCount} sesi</Fact>
          <Fact label="Jatuh tempo">
            {context.stage ? <Badge variant="warning">{getEvaluationDueLabel(context.stage)}</Badge> : 'Tidak ada'}
          </Fact>
        </div>

        {warning && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertTriangle className="h-4 w-4 !text-amber-600" />
            <AlertTitle>Peringatan akademik</AlertTitle>
            <AlertDescription className="text-amber-800">
              Perpanjangan masa bimbingan 1 bulan berlaku sampai {formatDateTimeWib(warning.extensionUntil)}.
              {warning.followUpDue ? ' Batas itu sudah lewat; pembimbing akan mengisi tindak lanjut.' : ''}
            </AlertDescription>
          </Alert>
        )}

        {context.openEvaluation && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Menunggu keputusan</p>
            <ThesisGuidanceEvaluationSummary evaluation={context.openEvaluation} />
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Riwayat evaluasi</p>
          {context.history.length === 0 ? (
            <EmptyState size="sm" title="Belum Ada Evaluasi" description="Evaluasi yang sudah tercatat atau diputuskan akan tampil di sini." className="py-6" />
          ) : (
            <div className="space-y-3">
              {context.history.map((evaluation) => <ThesisGuidanceEvaluationSummary key={evaluation.id} evaluation={evaluation} />)}
            </div>
          )}
        </div>
      </CardContent>

      {isP1 && <LecturerThesisGuidanceEvaluationFormDialog open={formOpen} onOpenChange={setFormOpen} context={context} />}
    </Card>
  );
}
