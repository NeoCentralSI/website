import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomTable, type Column } from '@/components/layout/CustomTable';
import { SeminarStatusBadge } from '@/components/seminar/SeminarStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useExaminerRequests } from '@/hooks/thesis-seminar/useLecturerSeminar';
import { toTitleCaseName, formatRoleName } from '@/lib/text';
import { CheckCircle2, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { ExaminerRequestItem } from '@/types/seminar.types';
import { ExaminerResponseDialog } from './ExaminerResponseDialog';

export function ExaminerRequestsTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedSeminar, setSelectedSeminar] = useState<ExaminerRequestItem | null>(null);

  const queryParams = useMemo(() => {
    const params: { search?: string } = {};
    if (search.trim()) params.search = search.trim();
    return params;
  }, [search]);

  const { data: seminars, isLoading, isFetching, error, refetch } = useExaminerRequests(queryParams);

  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || 'Gagal memuat data permintaan penguji');
    }
  }, [error]);

  const filteredData = seminars || [];
  const total = filteredData.length;

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const openResponseDialog = (seminar: ExaminerRequestItem) => {
    setSelectedSeminar(seminar);
    setResponseDialogOpen(true);
  };

  const columns: Column<ExaminerRequestItem>[] = [
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
    // {
    //   key: 'role',
    //   header: 'Peran',
    //   render: (row) => (
    //     <Badge variant="outline" className="text-xs">
    //       Penguji {row.myExaminerOrder}
    //     </Badge>
    //   ),
    // },
    {
      key: 'examinerStatus',
      header: 'Status Persetujuan',
      render: (row) => {
        if (row.myExaminerStatus === 'pending') {
          return (
            <Badge variant="warning" className="text-xs">
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
      key: 'seminarStatus',
      header: 'Status Seminar',
      render: (row) => <SeminarStatusBadge status={row.status} />,
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
            onClick={() => navigate(`/tugas-akhir/seminar/lecturer/${row.id}`)}
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
      <CustomTable<ExaminerRequestItem>
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

      <ExaminerResponseDialog
        open={responseDialogOpen}
        onOpenChange={setResponseDialogOpen}
        seminar={selectedSeminar}
        onSuccess={() => {
          refetch();
          setResponseDialogOpen(false);
        }}
      />
    </>
  );
}
