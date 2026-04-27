import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { RefreshButton } from '@/components/ui/refresh-button';
import { useAdminThesisSeminarValidation } from '@/hooks/thesis-seminar/useAdminThesisSeminar';
import { AdminThesisSeminarValidationTable } from '@/components/thesis-seminar/AdminThesisSeminarValidationTable';


const VALIDATION_STATUSES = [
  'registered',
  'verified',
  'examiner_assigned',
  'scheduled',
  'ongoing',
].join(',');

export function AdminThesisSeminarValidationPanel() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isFetching, refetch } = useAdminThesisSeminarValidation({
    search: search.trim() || undefined,
    status: VALIDATION_STATUSES,
  });

  const filteredData = data ?? [];
  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  return (
    <AdminThesisSeminarValidationTable
      data={pagedData}
      loading={isLoading}
      isRefreshing={isFetching && !isLoading}
      page={page}
      pageSize={pageSize}
      total={filteredData.length}
      searchValue={search}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      onDetail={(id) => navigate(`/tugas-akhir/seminar-hasil/validasi/${id}`)}
      actions={
        <RefreshButton
          onClick={() => refetch()}
          isRefreshing={isFetching && !isLoading}
        />
      }
    />

  );
}
