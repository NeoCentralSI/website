import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomTable, type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useAssignmentSeminars } from '@/hooks/thesis-seminar';
import { toTitleCaseName } from '@/lib/text';
import { ThesisEventTitleCell, ThesisPersonnelListCell } from '@/components/shared/ThesisTableCells';
import { UserPlus, Pencil, CheckCircle2, Eye, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { AssignmentSeminarItem, ExaminerAssignmentStatus } from '@/types/seminar.types';
import { LecturerThesisSeminarAssignExaminerDialog } from './LecturerThesisSeminarAssignExaminerDialog';

// ============================================================
// Assignment status badge
// ============================================================

const ASSIGNMENT_STATUS_MAP: Record<
  ExaminerAssignmentStatus,
  { label: string; variant: 'warning' | 'info' | 'destructive' | 'success' | 'secondary' }
> = {
  unassigned: { label: 'Belum Ditetapkan', variant: 'warning' },
  pending: { label: 'Menunggu Persetujuan', variant: 'info' },
  rejected: { label: 'Ditolak', variant: 'destructive' },
  partially_rejected: { label: 'Sebagian Ditolak', variant: 'warning' },
  confirmed: { label: 'Ditetapkan', variant: 'success' },
  finished: { label: 'Selesai', variant: 'secondary' },
};

function AssignmentStatusBadge({ status }: { status: ExaminerAssignmentStatus }) {
  const config = ASSIGNMENT_STATUS_MAP[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ============================================================
// Component
// ============================================================

export function LecturerThesisSeminarExaminerAssignmentTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSeminar, setSelectedSeminar] = useState<AssignmentSeminarItem | null>(null);



  const { data: seminars, isLoading, isFetching, error, refetch } = useAssignmentSeminars();

  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || 'Gagal memuat data penetapan penguji');
    }
  }, [error]);

  // Client-side assignment status & search filter
  const filteredData = useMemo(() => {
    if (!seminars) return [];
    let result = seminars;
    if (statusFilter) {
      result = result.filter((s) => s.assignmentStatus === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          s.studentNim.toLowerCase().includes(q) ||
          s.thesisTitle.toLowerCase().includes(q)
      );
    }
    return result;
  }, [seminars, statusFilter, search]);

  const total = filteredData.length;
  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const statusOptions = [
    { label: 'Semua', value: '' },
    { label: 'Belum Ditetapkan', value: 'unassigned' },
    { label: 'Menunggu Persetujuan', value: 'pending' },
    { label: 'Sebagian Ditolak', value: 'partially_rejected' },
    { label: 'Ditolak', value: 'rejected' },
    { label: 'Ditetapkan', value: 'confirmed' },
    { label: 'Selesai', value: 'finished' },
  ];

  const openAssignDialog = (seminar: AssignmentSeminarItem) => {
    setSelectedSeminar(seminar);
    setDialogOpen(true);
  };

  const columns: Column<AssignmentSeminarItem>[] = [
    {
      key: 'student',
      header: 'Mahasiswa',
      width: 280,
      render: (row) => (
        <ThesisEventTitleCell
          title={row.thesisTitle}
          studentName={row.studentName}
          studentNim={row.studentNim}
        />
      ),
    },
    {
      key: 'supervisors',
      header: 'Pembimbing',
      width: 200,
      render: (row) => <ThesisPersonnelListCell people={row.supervisors.map((s, i) => ({ name: s.name, order: i + 1 }))} />,
    },
    {
      key: 'examiners',
      header: 'Penguji',
      width: 220,
      render: (row) => {
        if (row.examiners.length === 0) {
          return <span className="text-sm text-muted-foreground italic">-</span>;
        }
        return (
          <div className="space-y-1 text-sm leading-snug text-foreground">
            {row.examiners.map((e, idx) => {
              let StatusIcon = Clock;
              let iconColor = 'text-amber-500';
              if (e.availabilityStatus === 'available') {
                StatusIcon = CheckCircle2;
                iconColor = 'text-emerald-600';
              } else if (e.availabilityStatus === 'unavailable') {
                StatusIcon = XCircle;
                iconColor = 'text-red-600';
              }
              return (
                <div key={e.id} className="flex items-center gap-1.5 truncate" title={`${idx + 1}. ${toTitleCaseName(e.lecturerName)}`}>
                  <span>{idx + 1}. {toTitleCaseName(e.lecturerName)}</span>
                  <StatusIcon className={`w-3.5 h-3.5 ${iconColor} shrink-0`} />
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'assignmentStatus',
      header: 'Status',
      width: 160,
      filter: {
        type: 'select',
        value: statusFilter,
        onChange: (val: string) => {
          setStatusFilter(val);
          setPage(1);
        },
        options: statusOptions,
      },
      render: (row) => <AssignmentStatusBadge status={row.assignmentStatus} />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-center',
      width: 100,
      render: (row) => {
        const canAssign = row.assignmentStatus === 'unassigned' || row.assignmentStatus === 'rejected';
        const canReplace = row.assignmentStatus === 'partially_rejected';
        const canChange = row.assignmentStatus === 'pending' || row.assignmentStatus === 'confirmed';

        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => navigate(`/tugas-akhir/seminar-hasil/${row.id}`)}
              title="Lihat Detail"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canAssign && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => openAssignDialog(row)}
                title="Tetapkan Penguji"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
            {canReplace && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => openAssignDialog(row)}
                title="Ganti Penguji"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canChange && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => openAssignDialog(row)}
                title="Ubah Penguji"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {row.assignmentStatus === 'finished' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                disabled
                title="Seminar sudah selesai"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <CustomTable<AssignmentSeminarItem>
        columns={columns}
        data={pagedData}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        enableColumnFilters
        emptyText="Belum ada seminar yang perlu ditetapkan penguji."
        rowKey={(row) => row.id}
        actions={
          <RefreshButton
            onClick={() => refetch()}
            isRefreshing={isFetching && !isLoading}
          />
        }
      />

      <LecturerThesisSeminarAssignExaminerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        seminar={selectedSeminar}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
        }}
      />
    </>
  );
}
