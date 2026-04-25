import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomTable, type Column } from '@/components/layout/CustomTable';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { ThesisExaminerAvailabilityStatusBadge } from '@/components/shared/ThesisExaminerAvailabilityStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useSupervisedStudentDefences } from '@/hooks/defence';
import { toTitleCaseName, formatRoleName } from '@/lib/text';
import { CheckCircle2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { SupervisedStudentDefenceItem } from '@/types/defence.types';

export function DefenceSupervisedStudentTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const queryParams = useMemo(() => {
    const params: { search?: string } = {};
    if (search.trim()) params.search = search.trim();
    return params;
  }, [search]);

  const { data: defences, isLoading, isFetching, error, refetch } = useSupervisedStudentDefences(queryParams);

  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || 'Gagal memuat data mahasiswa bimbingan');
    }
  }, [error]);

  const filteredData = defences || [];
  const total = filteredData.length;

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const columns: Column<SupervisedStudentDefenceItem>[] = [
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
      key: 'myRole',
      header: 'Peran Saya',
      render: (row) => (
        <Badge variant="outline" className="text-xs">
          {formatRoleName(row.myRole)}
        </Badge>
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
                <ThesisExaminerAvailabilityStatusBadge status={e.availabilityStatus} className="text-[10px] px-1 py-0" />
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status Sidang',
      render: (row) => (
        <ThesisEventStatusBadge 
          status={row.status} 
          scheduledDate={row.date} 
          startTime={row.startTime} 
        />
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-center',
      width: 80,
      render: (row) => (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/tugas-akhir/sidang/lecturer/${row.id}`)}
            title="Lihat Detail"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <CustomTable<SupervisedStudentDefenceItem>
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
      emptyText="Belum ada mahasiswa bimbingan yang mendaftar sidang."
      rowKey={(row) => row.id}
      actions={
        <RefreshButton
          onClick={() => refetch()}
          isRefreshing={isFetching && !isLoading}
        />
      }
    />
  );
}
