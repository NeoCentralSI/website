import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomTable, type Column } from '@/components/layout/CustomTable';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useDefenceExaminerRequests } from '@/hooks/thesis-defence';
import { ThesisEventTitleCell, ThesisPersonnelListCell } from '@/components/shared/ThesisTableCells';
import { CheckCircle2, XCircle, Eye, Clock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import type { ExaminerDefenceRequestItem } from '@/types/defence.types';
import { LecturerThesisDefenceExaminerResponseDialog } from './LecturerThesisDefenceExaminerResponseDialog';

const COLUMN_WIDTHS = {
  student: 300,
  supervisors: 220,
  examinerStatus: 180,
  defenceStatus: 160,
  actions: 150,
} as const;

export function LecturerThesisDefenceExaminerRequestsTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedDefence, setSelectedDefence] = useState<ExaminerDefenceRequestItem | null>(null);

  const { data: defences, isLoading, isFetching, error, refetch } = useDefenceExaminerRequests();

  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || 'Gagal memuat data permintaan penguji');
    }
  }, [error]);

  const filteredData = useMemo(() => {
    if (!defences) return [];
    let result = [...defences];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.studentName.toLowerCase().includes(q) ||
          item.studentNim.toLowerCase().includes(q) ||
          item.thesisTitle.toLowerCase().includes(q)
      );
    }

    // Priority sorting
    result.sort((a, b) => {
      const getRank = (item: ExaminerDefenceRequestItem) => {
        if (item.myExaminerStatus === 'available' && item.status === 'ongoing') return 1;
        if (item.myExaminerStatus === 'pending' && (item.status === 'verified' || item.status === 'examiner_assigned')) return 2;
        return 3;
      };

      const rankA = getRank(a);
      const rankB = getRank(b);

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Sub-sorting for Persetujuan: pending > available > unavailable
      const approvalOrder: Record<string, number> = { pending: 1, available: 2, unavailable: 3 };
      const orderA = approvalOrder[a.myExaminerStatus || ''] || 99;
      const orderB = approvalOrder[b.myExaminerStatus || ''] || 99;
      if (orderA !== orderB) return orderA - orderB;

      // Sub-sorting for Defence status
      const defenceOrder: Record<string, number> = {
        ongoing: 1,
        verified: 2,
        examiner_assigned: 3,
        scheduled: 4,
        passed: 5,
        passed_with_revision: 6,
        failed: 7,
        cancelled: 8,
      };
      const dOrderA = defenceOrder[a.status] || 99;
      const dOrderB = defenceOrder[b.status] || 99;
      if (dOrderA !== dOrderB) return dOrderA - dOrderB;

      // Tie-breakers
      const aTime = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
      const bTime = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;

      return a.studentName.localeCompare(b.studentName);
    });

    return result;
  }, [defences, search]);

  const total = filteredData.length;

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const openResponseDialog = (defence: ExaminerDefenceRequestItem) => {
    setSelectedDefence(defence);
    setResponseDialogOpen(true);
  };

  const columns: Column<ExaminerDefenceRequestItem>[] = [
    {
      key: 'student',
      header: 'Mahasiswa',
      width: COLUMN_WIDTHS.student,
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
      width: COLUMN_WIDTHS.supervisors,
      render: (row) => <ThesisPersonnelListCell people={row.supervisors.map((s, i) => ({ name: s.name, order: i + 1 }))} />,
    },
    {
      key: 'examinerStatus',
      header: 'Status Persetujuan',
      width: COLUMN_WIDTHS.examinerStatus,
      render: (row) => {
        if (row.myExaminerStatus === 'pending') {
          return (
            <Badge variant="warning" className="text-xs">
              <Clock className="h-3 w-3 mr-1 inline" />
              Menunggu Respons
            </Badge>
          );
        }
        if (row.myExaminerStatus === 'available') {
          return (
            <Badge variant="success" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Disetujui
            </Badge>
          );
        }
        if (row.myExaminerStatus === 'unavailable') {
          return (
            <Badge variant="destructive" className="text-xs">
              <XCircle className="h-3 w-3 mr-1" />
              Ditolak
            </Badge>
          );
        }
        return null;
      },
    },
    {
      key: 'defenceStatus',
      header: 'Status Sidang',
      width: COLUMN_WIDTHS.defenceStatus,
      render: (row) => <ThesisEventStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-center',
      width: COLUMN_WIDTHS.actions,
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => navigate(`/tugas-akhir/sidang/${row.id}`)}
            title="Lihat Detail"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.myExaminerStatus === 'pending' && row.myExaminerId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => openResponseDialog(row)}
              title="Tanggapi"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <CustomTable<ExaminerDefenceRequestItem>
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
        emptyText="Belum ada penugasan menguji."
        rowKey={(row) => row.id}
        actions={
          <RefreshButton
            onClick={() => refetch()}
            isRefreshing={isFetching && !isLoading}
          />
        }
      />

      <LecturerThesisDefenceExaminerResponseDialog
        open={responseDialogOpen}
        onOpenChange={setResponseDialogOpen}
        defence={selectedDefence}
        onSuccess={() => {
          refetch();
          setResponseDialogOpen(false);
        }}
      />
    </>
  );
}
