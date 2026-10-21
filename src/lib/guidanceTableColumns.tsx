import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import StatusBadge from '@/components/thesis/StatusBadge';
import { EyeIcon, CalendarClock, XCircle, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import type { GuidanceItem, GuidanceStatus } from '@/services/studentGuidance.service';
import type { Column } from '@/components/layout/CustomTable';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatThesisDocName, formatDateTimeWib } from '@/lib/text';
import { GUIDANCE_ACTOR_LABELS, GUIDANCE_STATUS_LABELS } from '@/lib/thesisLabels';
import { DateTimeCell, GuidanceDocCell, STICKY_ACTION_COLUMN_CLASS } from '@/lib/guidanceCells';
import { ThesisPhaseBadge } from '@/components/shared/ThesisPhaseBadge';
import { THESIS_PHASE_FILTER_LABELS } from '@/lib/thesisLabels';
import type { PhaseFilterValue } from '@/components/thesis/ThesisPhaseFilter';

interface GetGuidanceTableColumnsOptions {
  items: GuidanceItem[];
  supervisorFilter: string;
  setSupervisorFilter: (value: string) => void;
  status: GuidanceStatus | '';
  setStatus: (value: GuidanceStatus | '') => void;
  setPage: (value: number) => void;
  onViewDocument: (fileName?: string | null, filePath?: string | null) => void;
  navigate: ReturnType<typeof useNavigate>;
  onReschedule?: (guidanceId: string) => void;
  onCancel?: (guidanceId: string) => void;
  onExport?: (guidanceId: string) => void;
  /** Student NIM for document filename display */
  studentNim?: string | null;
  /** Student name for document filename display */
  studentName?: string | null;
  /** Selected guidance IDs for bulk actions */
  selectedIds?: Set<string>;
  /** Toggle selection of a single guidance */
  onToggleSelect?: (id: string) => void;
  /** Toggle select all visible items */
  onToggleSelectAll?: (ids: string[], selected: boolean) => void;
  /** IDs of exportable items (completed/summary_pending with sessionSummary) */
  exportableIds?: string[];
  /** Phase filter in the "Jenis" column header; omitted = no filter. */
  phase?: PhaseFilterValue;
  setPhase?: (value: PhaseFilterValue) => void;
}

export const getGuidanceTableColumns = (options: GetGuidanceTableColumnsOptions): Column<GuidanceItem>[] => {
  const {
    items,
    supervisorFilter,
    setSupervisorFilter,
    status,
    setStatus,
    setPage,
    onViewDocument,
    navigate,
    onReschedule,
    onCancel,
    onExport,
    studentNim,
    studentName,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    exportableIds,
    phase,
    setPhase,
  } = options;

  const hasSelection = !!selectedIds && !!onToggleSelect;

  const columns: Column<GuidanceItem>[] = [];

  // Checkbox column for bulk selection
  if (hasSelection && exportableIds) {
    columns.push({
      key: 'select',
      header: () => {
        const allSelected = exportableIds.length > 0 && exportableIds.every((id) => selectedIds.has(id));
        const someSelected = exportableIds.some((id) => selectedIds.has(id));
        return (
          <Checkbox
            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
            onCheckedChange={(checked) => {
              onToggleSelectAll?.(exportableIds, !!checked);
            }}
            aria-label="Pilih semua"
          />
        );
      },
      width: 40,
      render: (r) => {
        const isExportable = (r.status === 'completed' || r.status === 'summary_pending') && !!r.sessionSummary;
        if (!isExportable) return null;
        return (
          <Checkbox
            checked={selectedIds.has(r.id)}
            onCheckedChange={() => onToggleSelect(r.id)}
            aria-label={`Pilih bimbingan`}
          />
        );
      },
    });
  }

  columns.push(
    {
      key: 'supervisor',
      header: 'Pembimbing',
      accessor: (r) => r.supervisorName || r.supervisorId || '-',
      filter: {
        type: 'select',
        value: supervisorFilter,
        onChange: (v: string) => {
          setSupervisorFilter(v);
          setPage(1);
        },
        options: [
          { label: 'Semua', value: '' },
          ...Array.from(new Set(items.map((it) => it.supervisorName || it.supervisorId || '-'))).map((name) => ({
            label: String(name),
            value: String(name),
          })),
        ],
      },
    },
    {
      // Jenis sesi (Proposal / Penelitian), tetap sejak dibuat
      key: 'phase',
      header: 'Jenis',
      render: (r) => (r.phase ? <ThesisPhaseBadge phase={r.phase} /> : '-'),
      ...(setPhase
        ? {
            filter: {
              type: 'select' as const,
              value: phase ?? '',
              onChange: (v: string) => {
                setPhase(v as PhaseFilterValue);
                setPage(1);
              },
              options: [
                { label: 'Semua', value: '' },
                { label: THESIS_PHASE_FILTER_LABELS.proposal, value: 'proposal' },
                { label: THESIS_PHASE_FILTER_LABELS.research, value: 'research' },
              ],
            },
          }
        : {}),
    },
    {
      key: 'time',
      header: 'Waktu',
      // C6: the effective schedule (approvedDate ?? requestedDate)
      render: (r) => <DateTimeCell date={r.approvedDate ?? r.requestedDate} />,
    },
    {
      key: 'doc',
      header: 'Dokumen',
      render: (r) => (
        <GuidanceDocCell
          filePath={r.document?.filePath}
          displayName={formatThesisDocName(studentNim, studentName)}
          onViewPdf={() => onViewDocument(r.document?.fileName, r.document?.filePath)}
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        // A scheduled session (legacy "rescheduled" included) needs a summary, and a
        // summary sent back by the lecturer (summary_rejected) needs a revision.
        const isScheduled = r.status === 'accepted' || r.status === 'rescheduled';
        const needsSummary = (isScheduled && !r.sessionSummary) || r.status === 'summary_rejected';
        const hasSummary = !!r.sessionSummary;
        const isCompleted = r.status === 'completed';
        const context = getGuidanceStatusContext(r);

        return (
          <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={r.status} />
            {needsSummary && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs border-amber-300 bg-amber-50 text-amber-700 gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Isi
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Catatan bimbingan perlu diisi</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {hasSummary && !isCompleted && r.status === 'summary_pending' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs border-violet-300 bg-violet-50 text-violet-700 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Terkirim
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Menunggu approval dosen</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {context && (
            <p className="max-w-[260px] text-xs text-muted-foreground line-clamp-2" title={context}>
              {context}
            </p>
          )}
          </div>
        );
      },
      filter: {
        type: 'select',
        value: status,
        onChange: (v: string) => {
          setStatus(v as GuidanceStatus | '');
          setPage(1);
        },
        options: [
          { label: 'Semua', value: '' },
          ...(['requested', 'accepted', 'summary_pending', 'summary_rejected', 'completed', 'rejected', 'cancelled'] as const).map(
            (value) => ({ label: GUIDANCE_STATUS_LABELS[value], value }),
          ),
        ],
      },
    },
    {
      key: 'notes',
      header: 'Catatan',
      render: (r) => {
        const isCompleted = r.status === 'completed';
        const isSummaryPending = r.status === 'summary_pending';
        const summary = r.sessionSummary as string | undefined;
        if (!summary && !isCompleted && !isSummaryPending) return <span className="text-muted-foreground">-</span>;
        if (!summary) return <span className="text-xs text-muted-foreground italic">Belum diisi</span>;
        return (
          <div className="flex items-center gap-1 max-w-[200px]">
            <span className="text-xs truncate" title={summary}>
              {summary.length > 50 ? `${summary.slice(0, 50)}...` : summary}
            </span>
            {(isCompleted || isSummaryPending) && onExport && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => onExport(r.id)}
                title="Download catatan bimbingan"
              >
                <Download className="size-3" />
              </Button>
            )}
          </div>
        );
      },
    },
    {
      key: 'action',
      header: 'Aksi',
      className: STICKY_ACTION_COLUMN_CLASS,
      render: (r) => {
        const isRequested = r.status === 'requested';
        // Legacy "rescheduled" is a scheduled session like "accepted".
        const isAccepted = r.status === 'accepted' || r.status === 'rescheduled';
        const isCancellable = isRequested || isAccepted;

        return (
          <div className="flex items-center gap-1">
            {isRequested && onReschedule && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onReschedule(r.id)}
                title="Ubah jadwal pengajuan"
              >
                <CalendarClock className="size-4" />
              </Button>
            )}
            {isCancellable && onCancel && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onCancel(r.id)}
                title={isAccepted ? 'Batalkan bimbingan terjadwal' : 'Batalkan pengajuan bimbingan'}
              >
                <XCircle className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate(`/tugas-akhir/bimbingan/student/session/${r.id}`)}
              title="Detail"
            >
              <EyeIcon className="size-4" />
            </Button>
          </div>
        );
      },
    },
  );

  return columns;
};

/**
 * Context shown under a session status: rejection reason + suggested time, lecturer
 * reschedule reason, cancellation (who + why), or the lecturer's summary revision notes.
 */
export function getGuidanceStatusContext(r: GuidanceItem): string | null {
  const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  if (r.status === 'rejected') {
    const reason = text(r.rejectionReason);
    const suggested = r.suggestedDate ? formatDateTimeWib(r.suggestedDate) : null;
    return [reason && `Alasan: ${reason}`, suggested && `Usulan waktu dosen: ${suggested}`].filter(Boolean).join(' · ') || null;
  }
  if (r.status === 'cancelled') {
    const reason = text(r.cancelReason) ?? text(r.rejectionReason);
    const by = r.cancelledBy ? `Dibatalkan oleh ${GUIDANCE_ACTOR_LABELS[r.cancelledBy].toLowerCase()}` : 'Dibatalkan';
    return reason ? `${by}: ${reason}` : null;
  }
  if (r.status === 'summary_rejected') {
    const notes = text(r.supervisorFeedback);
    return notes ? `Perlu diperbaiki: ${notes}` : null;
  }
  if ((r.status === 'accepted' || r.status === 'rescheduled') && text(r.rescheduleReason)) {
    return `Jadwal diubah dosen: ${text(r.rescheduleReason)}`;
  }
  return null;
}
