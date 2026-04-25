import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomTable, type Column } from '@/components/layout/CustomTable';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useDefenceExaminerRequests } from '@/hooks/defence';
import { toTitleCaseName, formatRoleName } from '@/lib/text';
import { Eye } from 'lucide-react';
import { ThesisExaminerAvailabilityStatusBadge } from '@/components/shared/ThesisExaminerAvailabilityStatusBadge';
import { toast } from 'sonner';
import type { ExaminerDefenceRequestItem } from '@/types/defence.types';
import { DefenceExaminerResponseDialog } from './DefenceExaminerResponseDialog';

export function DefenceExaminerRequestsTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedDefence, setSelectedDefence] = useState<ExaminerDefenceRequestItem | null>(null);

  const queryParams = useMemo(() => {
    const params: { search?: string } = {};
    if (search.trim()) params.search = search.trim();
    return params;
  }, [search]);

  const { data: defences, isLoading, isFetching, error, refetch } = useDefenceExaminerRequests(queryParams);

  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || 'Gagal memuat data permintaan penguji');
    }
  }, [error]);

  const filteredData = defences || [];
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
      key: 'examinerStatus',
      header: 'Status Persetujuan',
      render: (row) => (
        <ThesisExaminerAvailabilityStatusBadge status={row.myExaminerStatus || 'pending'} />
      ),
    },
    {
      key: 'defenceStatus',
      header: 'Status Sidang',
      render: (row) => <ThesisEventStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-center',
      width: 160,
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/tugas-akhir/sidang/lecturer/${row.id}`)}
            title="Lihat Detail"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.myExaminerStatus === 'pending' && row.myExaminerId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openResponseDialog(row)}
            >
              Tanggapi
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

      <DefenceExaminerResponseDialog
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
