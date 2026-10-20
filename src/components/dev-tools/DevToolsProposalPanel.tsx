import { useMemo, useState } from 'react';
import { History } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { SupervisorRequestStatusBadge } from '@/components/shared/SupervisorRequestStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDevToolsMutations, useDevToolsSupervisorRequests } from '@/hooks/dev-tools/useDevTools';
import { usePagedSearch } from '@/hooks/shared/usePagedSearch';
import { formatDateTimeWib } from '@/lib/text';
import type { DevToolsSupervisorRequest } from '@/types/devTools.types';
import { TruncatedText } from './DevToolsShared';

/** The sending time that opens "Tarik Pengajuan" now (72 hours plus a minute). */
export function backdatedTime(now = new Date()): string {
  return new Date(now.getTime() - (72 * 60 + 1) * 60 * 1000).toISOString();
}


function SupervisorRequestCard() {
  const mutations = useDevToolsMutations();
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch();
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading, isFetching, refetch } = useDevToolsSupervisorRequests({ search: debouncedSearch, page, pageSize });

  const columns = useMemo<Column<DevToolsSupervisorRequest>[]>(() => [
    {
      key: 'student',
      header: 'Mahasiswa',
      render: (row) => (
        <div className="max-w-[190px]">
          <TruncatedText text={row.student.fullName} className="font-medium text-sm" />
          <div className="text-xs text-muted-foreground">{row.student.nim ?? '-'}</div>
        </div>
      ),
    },
    { key: 'lecturer', header: 'Dosen', render: (row) => <div className="max-w-[170px] text-sm"><TruncatedText text={row.lecturerName ?? 'Lewat departemen'} /></div> },
    { key: 'status', header: 'Status', render: (row) => <SupervisorRequestStatusBadge status={row.status} /> },
    { key: 'createdAt', header: 'Dikirim', className: 'text-xs', render: (row) => formatDateTimeWib(row.createdAt) },
    { key: 'withdraw', header: 'Bisa Ditarik', className: 'text-xs', render: (row) => formatDateTimeWib(row.withdrawAvailableAt) },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row) => (
        <Button variant="outline" size="sm" className="h-8" disabled={mutations.isSubmitting} onClick={() => mutations.setSupervisorRequestTime(row.id, backdatedTime())}>
          <History className="mr-1.5 h-3.5 w-3.5" />Mundurkan 72 Jam
        </Button>
      ),
    },
  ], [mutations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Waktu Pengajuan Pembimbing</CardTitle>
        <CardDescription>Memundurkan waktu kirim pengajuan agar aturan "tarik setelah 72 jam" dan pengingatnya bisa diuji sekarang.</CardDescription>
      </CardHeader>
      <CardContent>
        <CustomTable
          columns={columns}
          data={data?.data ?? []}
          loading={isLoading}
          isRefreshing={isFetching && !isLoading}
          subtleRefresh
          total={data?.meta.total ?? 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          searchValue={search}
          onSearchChange={setSearch}
          actions={<RefreshButton onClick={() => void refetch()} isRefreshing={isFetching && !isLoading} />}
          emptyText="Tidak ada pengajuan pembimbing ditemukan."
        />
      </CardContent>
    </Card>
  );
}

/** DevTools tab "Proposal": the sending time of supervisor requests (a pass starts research at once). */
export function DevToolsProposalPanel() {
  return (
    <div className="space-y-4">
      <SupervisorRequestCard />
    </div>
  );
}
