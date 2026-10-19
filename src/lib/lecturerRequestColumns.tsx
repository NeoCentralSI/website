import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/thesis/StatusBadge';
import { EyeIcon, XCircleIcon, CalendarClockIcon } from 'lucide-react';
import { toTitleCaseName, formatThesisDocName } from '@/lib/text';
import type { GuidanceItem } from '@/services/lecturerGuidance.service';
import type { Column } from '@/components/layout/CustomTable';
import { useNavigate } from 'react-router-dom';
import { GUIDANCE_STATUS_LABELS } from '@/lib/thesisLabels';
import { DateTimeCell, GuidanceDocCell, STICKY_ACTION_COLUMN_CLASS, TruncatedText } from '@/lib/guidanceCells';

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
  /** Move an accepted session (lecturer). */
  onReschedule?: (guidance: GuidanceItem) => void;
}

export const getLecturerRequestColumns = (
  options: GetLecturerRequestColumnsOptions
): Column<GuidanceItem>[] => {
  const { allRequests, studentFilter, setStudentFilter, statusFilter, setStatusFilter, setPage, navigate, onOpenDetail, onViewDocument, onCancel, onReschedule } =
    options;

  return [
    {
      key: 'tanggal',
      header: 'Tanggal',
      // C6: the effective schedule (approvedDate ?? requestedDate)
      render: (r) => <DateTimeCell date={r.approvedDate ?? r.requestedDate} />,
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
      render: (r) => <TruncatedText text={(r as any)?.notes} />,
    },
    {
      key: 'doc',
      header: 'Dokumen',
      render: (r) => {
        const filePath = (r as any)?.document?.filePath as string | undefined;
        const fileName = (r as any)?.document?.fileName as string | undefined;
        return (
          <GuidanceDocCell
            filePath={filePath}
            displayName={formatThesisDocName((r as any)?.studentNim, r.studentName)}
            onViewPdf={() => onViewDocument?.(fileName, filePath as string)}
          />
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
          ...(['requested', 'accepted', 'summary_pending', 'summary_rejected', 'completed', 'rejected', 'cancelled'] as const).map((value) => ({ label: GUIDANCE_STATUS_LABELS[value], value })),
        ],
      },
    },
    {
      key: 'action',
      header: 'Aksi',
      className: STICKY_ACTION_COLUMN_CLASS,
      render: (r) => {
        // Legacy 'rescheduled' is a scheduled session like 'accepted'.
        const isCancellable = r.status === 'accepted' || r.status === 'rescheduled';
        return (
          <div className="flex items-center gap-1">
            {isCancellable && onReschedule && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onReschedule(r)}
                title="Ubah jadwal"
              >
                <CalendarClockIcon className="size-4" />
              </Button>
            )}
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
