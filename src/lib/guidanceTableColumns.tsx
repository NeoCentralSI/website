import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import StatusBadge from '@/components/thesis/StatusBadge';
import { EyeIcon, FileTextIcon, CalendarClock, XCircle, AlertCircle, CheckCircle2, Download, DownloadIcon } from 'lucide-react';
import type { GuidanceItem, GuidanceStatus } from '@/services/studentGuidance.service';
import type { Column } from '@/components/layout/CustomTable';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatThesisDocName } from '@/lib/text';
import { getApiUrl } from '@/config/api';

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
      key: 'time',
      header: 'Waktu',
      accessor: (r) =>
        r.approvedDateFormatted ||
        r.requestedDateFormatted ||
        (r.approvedDate
          ? new Date(r.approvedDate).toLocaleString()
          : r.requestedDate
            ? new Date(r.requestedDate).toLocaleString()
            : '-'),
    },
    {
      key: 'doc',
      header: 'Dokumen',
      render: (r) => {
        const filePath = r.document?.filePath;
        if (!filePath) return <span className="text-muted-foreground">-</span>;

        const isPdf = filePath.toLowerCase().endsWith('.pdf');
        const isDocx = filePath.toLowerCase().endsWith('.docx') || filePath.toLowerCase().endsWith('.doc');
        const displayName = formatThesisDocName(studentNim, studentName);

        if (isDocx) {
          const downloadUrl = (() => {
            let url = filePath.startsWith('/') ? getApiUrl(filePath) : getApiUrl(`/${filePath}`);
            const token = localStorage.getItem('accessToken');
            if (token && filePath.includes('thesis/')) {
              url += (url.includes('?') ? '&' : '?') + `token=${token}`;
            }
            return url;
          })();

          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 max-w-[200px] text-green-600 hover:text-green-700 hover:bg-green-50"
              asChild
              title={`Download ${displayName}`}
            >
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <DownloadIcon className="size-4 shrink-0" />
                <span className="truncate text-xs">{displayName}</span>
              </a>
            </Button>
          );
        }

        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 max-w-[200px]"
            disabled={!isPdf}
            onClick={() => {
              onViewDocument(r.document?.fileName, r.document?.filePath);
            }}
            title={isPdf ? `Lihat ${displayName}` : 'Tidak ada dokumen PDF'}
          >
            <FileTextIcon className="size-4 shrink-0" />
            <span className="truncate text-xs">{isPdf ? displayName : '-'}</span>
          </Button>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        // Check if needs summary (accepted or summary_pending without sessionSummary)
        const needsSummary = (r.status === 'accepted' || r.status === 'summary_pending') && !r.sessionSummary;
        const hasSummary = !!r.sessionSummary;
        const isCompleted = r.status === 'completed';

        return (
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
          { label: 'Menunggu', value: 'requested' },
          { label: 'Diterima', value: 'accepted' },
          { label: 'Ditolak', value: 'rejected' },
          { label: 'Selesai', value: 'completed' },
          { label: 'Dibatalkan', value: 'cancelled' },
          { label: 'Menunggu Catatan', value: 'summary_pending' },
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
      render: (r) => {
        const isRejected = r.status === 'rejected';
        const isRequested = r.status === 'requested';
        const isAccepted = r.status === 'accepted';
        const isCancellable = isRequested || isAccepted;

        return (
          <div className="flex items-center gap-1">
            {isRequested && onReschedule && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onReschedule(r.id)}
                title="Reschedule jadwal bimbingan"
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
              title={isRejected ? 'Bimbingan ditolak' : 'Detail'}
              disabled={isRejected}
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
