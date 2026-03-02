import { useState, useMemo, useEffect } from 'react';
import { CustomTable, type Column } from '@/components/layout/CustomTable';
import { SeminarStatusBadge } from '@/components/seminar/SeminarStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useLecturerSeminars } from '@/hooks/seminar/useLecturerSeminar';
import { toTitleCaseName, formatRoleName } from '@/lib/text';
import { Eye, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { LecturerSeminarListItem } from '@/types/seminar.types';
import { ExaminerResponseDialog } from './ExaminerResponseDialog';

interface LecturerSeminarTableProps {
  onViewDetail?: (seminar: LecturerSeminarListItem) => void;
}

export function LecturerSeminarTable({ onViewDetail }: LecturerSeminarTableProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Response dialog state
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedSeminar, setSelectedSeminar] = useState<LecturerSeminarListItem | null>(null);

  const queryParams = useMemo(() => {
    const params: { search?: string } = {};
    if (search.trim()) params.search = search.trim();
    return params;
  }, [search]);

  const { data: seminars, isLoading, isFetching, error, refetch } = useLecturerSeminars(queryParams);

  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || 'Gagal memuat data seminar');
    }
  }, [error]);

  const filteredData = seminars || [];
  const total = filteredData.length;

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const openResponseDialog = (seminar: LecturerSeminarListItem) => {
    setSelectedSeminar(seminar);
    setResponseDialogOpen(true);
  };

  const columns: Column<LecturerSeminarListItem>[] = [
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
      key: 'myRoles',
      header: 'Peran Saya',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.myRoles.map((role, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {formatRoleName(role)}
            </Badge>
          ))}
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
      key: 'status',
      header: 'Status',
      render: (row) => <SeminarStatusBadge status={row.status} />,
    },
    {
      key: 'examinerStatus',
      header: 'Persetujuan',
      render: (row) => {
        if (!row.myExaminerStatus) return null;

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
      key: 'actions',
      header: 'Aksi',
      className: 'text-center',
      width: 160,
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          {onViewDetail && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetail(row)}
              title="Detail"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
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
      <CustomTable<LecturerSeminarListItem>
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
        emptyText="Belum ada seminar yang terkait dengan Anda."
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
