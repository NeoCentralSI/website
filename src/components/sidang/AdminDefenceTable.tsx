import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomTable, type Column } from '@/components/layout/CustomTable';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useAdminDefenceList } from '@/hooks/defence';
import { DefenceStatusBadge, getDefenceStatusFilterOptions } from '@/components/sidang/DefenceStatusBadge';
import { toTitleCaseName, formatRoleName } from '@/lib/text';
import { ClipboardCheck, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminDefenceListItem } from '@/types/defence.types';

interface AdminDefenceTableProps {
  onValidate?: (defence: AdminDefenceListItem) => void;
}

export function AdminDefenceTable({ onValidate }: AdminDefenceTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const queryParams = useMemo(() => {
    const params: { search?: string; status?: string } = {};
    if (search.trim()) params.search = search.trim();
    if (statusFilter && statusFilter !== 'finished') params.status = statusFilter;
    return params;
  }, [search, statusFilter]);

  const { data, isLoading, isFetching, error, refetch } = useAdminDefenceList(queryParams);

  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || 'Gagal memuat data sidang');
    }
  }, [error]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (statusFilter === 'finished') {
      return data.filter((s) =>
        ['passed', 'passed_with_revision', 'failed', 'cancelled'].includes(s.status)
      );
    }
    return data;
  }, [data, statusFilter]);

  const total = filteredData.length;
  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const columns: Column<AdminDefenceListItem>[] = [
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
      key: 'status',
      header: 'Status',
      filter: {
        type: 'select',
        value: statusFilter,
        onChange: (val: string) => {
          setStatusFilter(val);
          setPage(1);
        },
        options: getDefenceStatusFilterOptions(),
      },
      render: (row) => <DefenceStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-center',
      width: 140,
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/tugas-akhir/sidang/admin/${row.id}`)}
            title="Detail"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === 'registered' && onValidate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onValidate(row)}
              title="Validasi Dokumen"
            >
              <ClipboardCheck className="h-4 w-4 mr-1" />
              Validasi
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <CustomTable<AdminDefenceListItem>
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
      emptyText="Belum ada data sidang."
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
