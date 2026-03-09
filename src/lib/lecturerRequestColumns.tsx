import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/thesis/StatusBadge';
import { EyeIcon, FileTextIcon, XCircleIcon, DownloadIcon } from 'lucide-react';
import { toTitleCaseName, formatDateId, formatThesisDocName } from '@/lib/text';
import { getApiUrl } from '@/config/api';
import type { GuidanceItem } from '@/services/lecturerGuidance.service';
import type { Column } from '@/components/layout/CustomTable';
import { useNavigate } from 'react-router-dom';

interface GetLecturerRequestColumnsOptions {
  allRequests: GuidanceItem[];
  studentFilter: string;
  setStudentFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  setPage: (value: number) => void;
  navigate: ReturnType<typeof useNavigate>;
  onOpenDetail?: (guidance: GuidanceItem) => void;
  onViewDocument?: (fileName?: string | null, filePath?: string | null) => void;
  onCancel?: (guidanceId: string) => void;
}

export const getLecturerRequestColumns = (
  options: GetLecturerRequestColumnsOptions
): Column<GuidanceItem>[] => {
  const { allRequests, studentFilter, setStudentFilter, statusFilter, setStatusFilter, setPage, navigate, onOpenDetail, onViewDocument, onCancel } =
    options;

  return [
    {
      key: 'tanggal',
      header: 'Tanggal',
      accessor: (r) =>
        r.requestedDateFormatted ||
        r.approvedDateFormatted ||
        (r.requestedDate ? formatDateId(r.requestedDate) : '-'),
    },
    {
      key: 'student',
      header: 'Mahasiswa',
      accessor: (r) => toTitleCaseName(r.studentName || r.studentId || '-'),
      filter: {
        type: 'select',
        value: studentFilter,
        onChange: (v: string) => {
          setStudentFilter(v);
          setPage(1);
        },
        options: [
          { label: 'Semua', value: '' },
          ...Array.from(
            new Set(allRequests.map((it) => toTitleCaseName(it.studentName || it.studentId || '-')))
          ).map((name) => ({ label: name, value: name })),
        ],
      },
    },
    {
      key: 'notes',
      header: 'Catatan',
      accessor: (r) => String((r as any)?.notes ?? '-') as any,
    },
    {
      key: 'doc',
      header: 'Dokumen',
      render: (r) => {
        const filePath = (r as any)?.document?.filePath as string | undefined;
        const fileName = (r as any)?.document?.fileName as string | undefined;
        if (!filePath) return <span className="text-muted-foreground">-</span>;

        const isPdf = filePath.toLowerCase().endsWith('.pdf');
        const isDocx = filePath.toLowerCase().endsWith('.docx') || filePath.toLowerCase().endsWith('.doc');
        const displayName = formatThesisDocName((r as any)?.studentNim, r.studentName);

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
              className="h-8 gap-1.5 max-w-[220px] text-green-600 hover:text-green-700 hover:bg-green-50"
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

        if (!isPdf) return <span className="text-muted-foreground">-</span>;

        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 max-w-[220px]"
            onClick={() => onViewDocument?.(fileName, filePath)}
            title={`Lihat ${displayName}`}
          >
            <FileTextIcon className="size-4 shrink-0" />
            <span className="truncate text-xs">{displayName}</span>
          </Button>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (r) => <StatusBadge status={r.status as any} />,
      filter: {
        type: 'select',
        value: statusFilter,
        onChange: (v: string) => {
          setStatusFilter(v);
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
      key: 'action',
      header: 'Aksi',
      render: (r) => {
        const isCancellable = r.status === 'accepted';
        return (
          <div className="flex items-center gap-1">
            {isCancellable && onCancel && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onCancel(r.id)}
                title="Batalkan bimbingan"
              >
                <XCircleIcon className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Detail"
              onClick={() => {
                if (r.status === 'requested' && onOpenDetail) {
                  onOpenDetail(r);
                } else {
                  navigate(`/tugas-akhir/bimbingan/lecturer/session/${r.id}`);
                }
              }}
            >
              <EyeIcon className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];
};
