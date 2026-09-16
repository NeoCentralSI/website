import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import CustomTable from '@/components/layout/CustomTable';
import { getAdminAuditLogsAPI, type AdminAuditLog } from '@/services/admin.service';
import { formatDateId, toTitleCaseName } from '@/lib/text';

const ACTION_LABEL: Record<string, string> = {
  USER_CREATED: 'Buat pengguna',
  USER_ROLES_UPDATED: 'Ubah peran',
  ACADEMIC_YEAR_CREATED: 'Buat periode akademik',
  ACADEMIC_YEAR_UPDATED: 'Ubah periode akademik',
  QUOTA_DEFAULT_UPDATED: 'Ubah kuota default',
  QUOTA_LECTURER_UPDATED: 'Ubah kuota dosen',
};

export function AdminAuditLogCard() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-audit-logs', { page, pageSize }],
    queryFn: () => getAdminAuditLogsAPI({ page, pageSize }),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });

  const logs = data?.logs ?? [];
  const total = data?.meta?.total ?? 0;

  const columns = [
    {
      key: 'createdAt',
      header: 'Waktu',
      render: (row: AdminAuditLog) => (
        <span className="text-xs text-muted-foreground">{formatDateId(row.createdAt)}</span>
      ),
    },
    {
      key: 'action',
      header: 'Tindakan',
      render: (row: AdminAuditLog) => ACTION_LABEL[row.action] ?? row.action,
    },
    {
      key: 'actor',
      header: 'Pelaku',
      render: (row: AdminAuditLog) => toTitleCaseName(row.actor?.fullName) || row.actor?.email || '-',
    },
    {
      key: 'entity',
      header: 'Objek',
      render: (row: AdminAuditLog) => (
        <span className="text-xs text-muted-foreground">
          {row.entity}
          {row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ''}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">Jejak otorisasi Admin</h2>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Perubahan peran, periode akademik, dan konfigurasi kuota.
        </p>
      </div>
      <CustomTable
        data={logs}
        columns={columns}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        emptyText="Belum ada jejak audit otorisasi"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        rowKey={(row) => row.id}
      />
    </div>
  );
}
