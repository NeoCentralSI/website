import { useState } from 'react';
import { AlertTriangle, Eye } from 'lucide-react';

import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateTimeCell } from '@/lib/guidanceCells';
import { BADGE_COLUMN_WIDTH, CLIP_CELL, DATE_COLUMN_WIDTH } from '@/lib/tableColumnWidths';
import { formatDateTimeWib } from '@/lib/text';
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

/**
 * Mini history table of one thesis: tanggal, tahap, status, Detail (Paket E4, 5 and 6; Paket E5:
 * the table standard, with a fixed layout, a two-line date and the detail as an icon).
 */
export function ThesisGuidanceEvaluationMiniTable({ evaluations, onDetail, emptyText = 'Belum ada evaluasi.' }: {
  evaluations: ThesisGuidanceEvaluation[];
  onDetail: (evaluation: ThesisGuidanceEvaluation) => void;
  emptyText?: string;
}) {
  if (evaluations.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="table-fixed min-w-[476px]">
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: DATE_COLUMN_WIDTH }}>Tanggal</TableHead>
            <TableHead>Tahap</TableHead>
            <TableHead style={{ width: BADGE_COLUMN_WIDTH.evaluationMiniStatus }}>Status</TableHead>
            <TableHead style={{ width: 64 }} className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evaluations.map((evaluation) => (
            <TableRow key={evaluation.id}>
              <TableCell className={CLIP_CELL}><DateTimeCell date={evaluation.createdAt} /></TableCell>
              <TableCell className={CLIP_CELL}>
                <span className="block whitespace-normal break-words text-sm line-clamp-2" title={getGuidanceEvaluationStageLabel(evaluation.stage)}>
                  {getGuidanceEvaluationStageLabel(evaluation.stage)}
                </span>
              </TableCell>
              <TableCell className={CLIP_CELL}><ThesisGuidanceEvaluationStatusBadge evaluation={evaluation} short /></TableCell>
              <TableCell className="text-center">
                <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => onDetail(evaluation)} />
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
