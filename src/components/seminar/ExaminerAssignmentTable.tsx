import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomTable, type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useAssignmentSeminars } from '@/hooks/thesis-seminar/useLecturerSeminar';
import { toTitleCaseName, formatRoleName } from '@/lib/text';
import { UserPlus, Pencil, CheckCircle2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { AssignmentSeminarItem, ExaminerAssignmentStatus } from '@/types/seminar.types';
import { AssignExaminerDialog } from './AssignExaminerDialog';

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
};

function AssignmentStatusBadge({ status }: { status: ExaminerAssignmentStatus }) {
  const config = ASSIGNMENT_STATUS_MAP[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ============================================================
// Assignment status filter options
// ============================================================

function getAssignmentStatusFilterOptions() {
  return [
    { label: 'Semua', value: '' },
    { label: 'Belum Ditetapkan', value: 'unassigned' },
    { label: 'Menunggu Persetujuan', value: 'pending' },
    { label: 'Sebagian Ditolak', value: 'partially_rejected' },
    { label: 'Ditolak', value: 'rejected' },
    { label: 'Ditetapkan', value: 'confirmed' },
  ];
}

// ============================================================
// Component
// ============================================================

export function ExaminerAssignmentTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSeminar, setSelectedSeminar] = useState<AssignmentSeminarItem | null>(null);

  const queryParams = useMemo(() => {
    const params: { search?: string } = {};
    if (search.trim()) params.search = search.trim();
    return params;
  }, [search]);

  const { data: seminars, isLoading, isFetching, error, refetch } = useAssignmentSeminars(queryParams);

  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || 'Gagal memuat data penetapan penguji');
    }
  }, [error]);

  // Client-side assignment status filter
  const filteredData = useMemo(() => {
    if (!seminars) return [];
    if (statusFilter) {
      return seminars.filter((s) => s.assignmentStatus === statusFilter);
    }
    return seminars;
  }, [seminars, statusFilter]);

  const total = filteredData.length;
  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const statusOptions = getAssignmentStatusFilterOptions();

  const openAssignDialog = (seminar: AssignmentSeminarItem) => {
    setSelectedSeminar(seminar);
    setDialogOpen(true);
  };

  const columns: Column<AssignmentSeminarItem>[] = [
    {
      key: 'student',
      header: 'Mahasiswa',
      render: (row) => (
        <div>
          <div className="font-medium">{toTitleCaseName(row.studentName)}</div>
          <div className="text-xs text-muted-foreground">{row.studentNim}</div>
        </div>
      ),
    },
    {
      key: 'thesisTitle',
      header: 'Judul Tugas Akhir',
      render: (row) => (
        <div className="max-w-xs truncate" title={row.thesisTitle}>
          {row.thesisTitle}
        </div>
      ),
    },
    {
      key: 'supervisors',
      header: 'Pembimbing',
      render: (row) => (
        <div className="space-y-0.5">
          {row.supervisors.map((s, i) => (
            <div key={i} className="text-xs">
              <span className="text-muted-foreground">{formatRoleName(s.role)}:</span>{' '}
              {toTitleCaseName(s.name)}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'examiners',
      header: 'Penguji',
      render: (row) => {
        if (row.examiners.length === 0) {
          return <span className="text-xs text-muted-foreground italic">Belum ditetapkan</span>;
        }
        return (
          <div className="space-y-0.5">
            {row.examiners.map((e) => (
              <div key={e.id} className="text-xs flex items-center gap-1">
                <span className="text-muted-foreground">Penguji {e.order}:</span>{' '}
                <span>{toTitleCaseName(e.lecturerName)}</span>
                {e.availabilityStatus === 'available' && (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                )}
                {e.availabilityStatus === 'unavailable' && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0">Ditolak</Badge>
                )}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'assignmentStatus',
      header: 'Status',
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
      width: 180,
      render: (row) => {
        const canAssign = row.assignmentStatus === 'unassigned' || row.assignmentStatus === 'rejected';
        const canReplace = row.assignmentStatus === 'partially_rejected';
        const canChange = row.assignmentStatus === 'pending';

        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/tugas-akhir/seminar/lecturer/${row.id}`)}
              title="Lihat Detail"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canAssign && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAssignDialog(row)}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Tetapkan
              </Button>
            )}
            {canReplace && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAssignDialog(row)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Ganti
              </Button>
            )}
            {canChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAssignDialog(row)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Ubah
              </Button>
            )}
            {row.assignmentStatus === 'confirmed' && (
              <Badge variant="success" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Selesai
              </Badge>
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

      <AssignExaminerDialog
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
