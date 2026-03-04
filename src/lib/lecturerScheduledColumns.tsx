import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/thesis/StatusBadge';
import { EyeIcon, FileTextIcon, XCircleIcon } from 'lucide-react';
import { toTitleCaseName, formatDateId, formatThesisDocName } from '@/lib/text';
import type { GuidanceItem } from '@/services/lecturerGuidance.service';
import type { Column } from '@/components/layout/CustomTable';
import { useNavigate } from 'react-router-dom';

interface GetLecturerScheduledColumnsOptions {
  allGuidances: GuidanceItem[];
  studentFilter: string;
  setStudentFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  setPage: (value: number) => void;
  navigate: ReturnType<typeof useNavigate>;
  onViewDocument?: (fileName?: string | null, filePath?: string | null) => void;
  onCancel?: (guidanceId: string) => void;
}

export const getLecturerScheduledColumns = (
  options: GetLecturerScheduledColumnsOptions
): Column<GuidanceItem>[] => {
  const { allGuidances, studentFilter, setStudentFilter, statusFilter, setStatusFilter, setPage, navigate, onViewDocument, onCancel } =
    options;

  return [
    {
      key: 'tanggal',
      header: 'Tanggal',
      accessor: (r) =>
        r.approvedDateFormatted ||
        r.requestedDateFormatted ||
        (r.approvedDate ? formatDateId(r.approvedDate) : '-'),
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
            new Set(allGuidances.map((it) => toTitleCaseName(it.studentName || it.studentId || '-')))
          ).map((name) => ({ label: name, value: name })),
        ],
      },
    },
    {
      key: 'doc',
      header: 'Dokumen',
      render: (r) => {
        const filePath = (r as any)?.document?.filePath as string | undefined;
        const fileName = (r as any)?.document?.fileName as string | undefined;
        const isPdf = filePath?.toLowerCase().endsWith('.pdf');
        if (!isPdf) return <span className="text-muted-foreground">-</span>;
        const displayName = formatThesisDocName((r as any)?.studentNim, r.studentName);
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
      key: 'notes',
      header: 'Agenda',
      accessor: (r) => {
        const notes = (r as any)?.notes || (r as any)?.studentNotes;
        if (!notes) return '-';
        return <span className="truncate max-w-62.5 block">{notes}</span>;
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
          { label: 'Diterima', value: 'accepted' },
          { label: 'Menunggu Catatan', value: 'summary_pending' },
          { label: 'Selesai', value: 'completed' },
          { label: 'Dibatalkan', value: 'cancelled' },
          { label: 'Ditolak', value: 'rejected' },
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
              onClick={() => navigate(`/tugas-akhir/bimbingan/lecturer/session/${r.id}`)}
            >
              <EyeIcon className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];
};
