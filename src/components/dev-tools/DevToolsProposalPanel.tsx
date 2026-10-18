import { useMemo, useState } from 'react';
import { History, Loader2, PlayCircle } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { SupervisorRequestStatusBadge } from '@/components/shared/SupervisorRequestStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useDevToolsMutations, useDevToolsSupervisorRequests } from '@/hooks/dev-tools/useDevTools';
import { usePromotionPreview, useRunPromotion } from '@/hooks/research-method/useResearchMethod';
import { usePagedSearch } from '@/hooks/shared/usePagedSearch';
import { formatDateTimeWib } from '@/lib/text';
import { getPromotionDecisionLabel, getPromotionDecisionVariant } from '@/lib/thesisLabels';
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
  const { data, isLoading, isFetching } = useDevToolsSupervisorRequests({ search: debouncedSearch, page, pageSize });

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
          emptyText="Tidak ada pengajuan pembimbing ditemukan."
        />
      </CardContent>
    </Card>
  );
}

function PromotionCard() {
  const { data, isLoading } = usePromotionPreview(true);
  const run = useRunPromotion();
  const rows = data?.rows ?? [];
  const reason = rows.some((r) => r.decision === 'promote') ? null : 'Belum ada mahasiswa yang memenuhi syarat naik ke Penelitian.';
  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Proses Kelulusan</CardTitle>
          <CardDescription>Menjalankan langkah naik ke Penelitian sekarang (biasanya berjalan otomatis setiap enam jam).</CardDescription>
        </div>
        <span title={reason ?? undefined}>
          <Button size="sm" disabled={Boolean(reason) || run.isPending} onClick={() => run.mutate()}>
            {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}Jalankan
          </Button>
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6"><Spinner className="h-5 w-5" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada mahasiswa lulus yang masih di fase proposal.</p>
        ) : (
          <ul className="divide-y rounded-lg border text-sm">
            {rows.map((r) => (
              <li key={r.thesisId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span>{r.student.fullName} · {r.student.identityNumber} <span className="block text-xs text-muted-foreground">{r.reason}</span></span>
                <Badge variant={getPromotionDecisionVariant(r.decision)}>{getPromotionDecisionLabel(r.decision)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** DevTools tab "Proposal" (rencana 10.8). */
export function DevToolsProposalPanel() {
  return (
    <div className="space-y-4">
      <SupervisorRequestCard />
      <PromotionCard />
    </div>
  );
}
