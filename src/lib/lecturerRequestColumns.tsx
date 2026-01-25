import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/thesis/StatusBadge';
import { EyeIcon } from 'lucide-react';
import { toTitleCaseName, formatDateId } from '@/lib/text';
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
}

export const getLecturerRequestColumns = (
  options: GetLecturerRequestColumnsOptions
): Column<GuidanceItem>[] => {
  const { allRequests, studentFilter, setStudentFilter, statusFilter, setStatusFilter, setPage, navigate, onOpenDetail } =
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
      accessor: (r) => {
        const fileName = (r as any)?.document?.fileName as string | undefined;
        return fileName || '-';
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
        ],
      },
    },
    {
      key: 'action',
      header: 'Aksi',
      render: (r) => (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          title="Detail" 
          onClick={() => {
            // Jika status requested, buka dialog untuk approve/reject
            // Jika status lain, navigate ke session detail
            if (r.status === 'requested' && onOpenDetail) {
              onOpenDetail(r);
            } else {
              navigate(`/tugas-akhir/bimbingan/lecturer/session/${r.id}`);
            }
          }}
        >
          <EyeIcon className="size-4" />
        </Button>
      ),
    },
  ];
};
