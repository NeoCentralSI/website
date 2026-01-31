import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/thesis/StatusBadge';
import { EyeIcon, FileTextIcon, CalendarClock, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { GuidanceItem, GuidanceStatus } from '@/services/studentGuidance.service';
import type { Column } from '@/components/layout/CustomTable';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  } = options;

  return [
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
        const f = r.document?.filePath || '';
        const isPdf = f.toLowerCase().endsWith('.pdf');
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!isPdf}
            onClick={() => {
              onViewDocument(r.document?.fileName, r.document?.filePath);
            }}
            title={isPdf ? `Lihat ${r.document?.fileName || 'dokumen'}` : 'Tidak ada dokumen PDF'}
          >
            <FileTextIcon className="size-4" />
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
        ],
      },
    },
    {
      key: 'action',
      header: 'Aksi',
      render: (r) => {
        const isRejected = r.status === 'rejected';
        const isRequested = r.status === 'requested';
        
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
            {isRequested && onCancel && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                onClick={() => onCancel(r.id)} 
                title="Batalkan pengajuan bimbingan"
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
  ];
};
