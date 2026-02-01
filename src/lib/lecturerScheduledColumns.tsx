import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EyeIcon, Clock, FileText, Target } from 'lucide-react';
import { toTitleCaseName, formatDateId } from '@/lib/text';
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
}

export const getLecturerScheduledColumns = (
  options: GetLecturerScheduledColumnsOptions
): Column<GuidanceItem>[] => {
  const { allGuidances, studentFilter, setStudentFilter, statusFilter, setStatusFilter, setPage, navigate } =
    options;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 border font-normal gap-1">
            <Clock className="h-3 w-3" />
            Menunggu Sesi
          </Badge>
        );
      case 'summary_pending':
        return (
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 border font-normal gap-1">
            <FileText className="h-3 w-3" />
            Menunggu Catatan
          </Badge>
        );
      default:
        return <Badge variant="outline" className="font-normal">{status}</Badge>;
    }
  };

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
      key: 'milestone',
      header: 'Milestone',
      accessor: (r) => {
        const milestoneName = r.milestoneName || (r as any)?.milestone?.title;
        if (!milestoneName) return '-';
        return (
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-purple-600" />
            <span className="truncate max-w-50">{milestoneName}</span>
          </div>
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
      accessor: (r) => getStatusBadge(r.status),
      filter: {
        type: 'select',
        value: statusFilter,
        onChange: (v: string) => {
          setStatusFilter(v);
          setPage(1);
        },
        options: [
          { label: 'Semua', value: '' },
          { label: 'Menunggu Sesi', value: 'accepted' },
          { label: 'Menunggu Catatan', value: 'summary_pending' },
        ],
      },
    },
    {
      key: 'action',
      header: 'Aksi',
      render: (r) => (
        <div className="flex items-center gap-2">
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
      ),
    },
  ];
};
