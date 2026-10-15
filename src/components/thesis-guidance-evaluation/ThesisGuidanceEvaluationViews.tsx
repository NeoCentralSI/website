import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateShortId, formatDateTimeWib } from '@/lib/text';
import { getGuidanceEvaluationStageLabel } from '@/lib/thesisLabels';
import type { ThesisGuidanceEvaluation, ThesisGuidanceEvaluationContext } from '@/types/thesis-guidance-evaluation.types';
import { ThesisGuidanceEvaluationStatusBadge, ThesisGuidanceEvaluationSummary } from './ThesisGuidanceEvaluationParts';

/** Every evaluation of a thesis, the one waiting for a decision first. */
export function evaluationsOf(context: ThesisGuidanceEvaluationContext | null | undefined): ThesisGuidanceEvaluation[] {
  if (!context) return [];
  return [...(context.openEvaluation ? [context.openEvaluation] : []), ...context.history];
}

export function ThesisGuidanceEvaluationDetailDialog({ evaluation, onClose }: { evaluation: ThesisGuidanceEvaluation | null; onClose: () => void }) {
  return (
    <RecordDetailDialog open={!!evaluation} onOpenChange={(open) => { if (!open) onClose(); }} title="Detail Evaluasi Bimbingan">
      {evaluation && <ThesisGuidanceEvaluationSummary evaluation={evaluation} />}
    </RecordDetailDialog>
  );
}

/** Mini history table of one thesis: tanggal, tahap, status, Detail (Paket E4, 5 and 6). */
export function ThesisGuidanceEvaluationMiniTable({ evaluations, onDetail, emptyText = 'Belum ada evaluasi.' }: {
  evaluations: ThesisGuidanceEvaluation[];
  onDetail: (evaluation: ThesisGuidanceEvaluation) => void;
  emptyText?: string;
}) {
  if (evaluations.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Tahap</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-20 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evaluations.map((evaluation) => (
            <TableRow key={evaluation.id}>
              <TableCell className="whitespace-nowrap">{formatDateShortId(evaluation.createdAt)}</TableCell>
              <TableCell className="whitespace-normal">{getGuidanceEvaluationStageLabel(evaluation.stage)}</TableCell>
              <TableCell><ThesisGuidanceEvaluationStatusBadge evaluation={evaluation} /></TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="ghost" className="px-2" onClick={() => onDetail(evaluation)}>Detail</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** "Riwayat evaluasi (N)": a small link that opens the history modal; hidden when N = 0. */
export function ThesisGuidanceEvaluationHistoryLink({ evaluations }: { evaluations: ThesisGuidanceEvaluation[] }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ThesisGuidanceEvaluation | null>(null);
  if (evaluations.length === 0) return null;
  return (
    <>
      <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setOpen(true)}>
        Riwayat evaluasi ({evaluations.length})
      </button>
      <RecordDetailDialog open={open} onOpenChange={setOpen} title="Riwayat Evaluasi Bimbingan">
        <ThesisGuidanceEvaluationMiniTable evaluations={evaluations} onDetail={setDetail} />
      </RecordDetailDialog>
      <ThesisGuidanceEvaluationDetailDialog evaluation={detail} onClose={() => setDetail(null)} />
    </>
  );
}

/** A running academic warning (1-month extension), as a ribbon (Paket E4, 6). */
export function AcademicWarningAlert({ warning, className }: {
  warning: ThesisGuidanceEvaluationContext['academicWarning'] | null | undefined;
  className?: string;
}) {
  if (!warning) return null;
  return (
    <Alert className={['border-amber-300 bg-amber-50 text-amber-900', className].filter(Boolean).join(' ')}>
      <AlertTriangle className="h-4 w-4 !text-amber-600" />
      <AlertTitle>Peringatan akademik</AlertTitle>
      <AlertDescription className="text-amber-800">
        Perpanjangan masa bimbingan 1 bulan berlaku sampai {formatDateTimeWib(warning.extensionUntil)}.
        {warning.followUpDue ? ' Batas itu sudah lewat; pembimbing akan mengisi tindak lanjut.' : ''}
      </AlertDescription>
    </Alert>
  );
}
