import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { SearchField, STALE_RESULT_CLASS } from '@/components/shared/SearchField';
import { usePagedSearch } from '@/hooks/shared/usePagedSearch';
import {
  useDepartmentChangeRequests,
  useKadepBatchDecision,
  useKadepDecision,
} from '@/hooks/thesis-change-request/useThesisChangeRequest';
import { toTitleCaseName } from '@/lib/text';
import { cn } from '@/lib/utils';
import type { ThesisChangeRequest } from '@/types/thesis-change-request.types';
import { groupByBatch } from './thesisChangeRequestGroups';
import {
  ThesisChangeRequestDecisionDialog,
  type ChangeDecisionDialogState,
} from './ThesisChangeRequestDecisionDialog';
import {
  SupervisorLoadNote,
  ThesisChangeRequestMeta,
  ThesisChangeRequestStatusBadge,
  ThesisChangeRequestSteps,
  ThesisChangeRequestSummary,
  ThesisChangeRequestTypeBadge,
} from './ThesisChangeRequestParts';

type Scope = 'pending' | 'history';
const PAGE_SIZE = 20;

const lecturerStepsDone = (request: ThesisChangeRequest) => request.currentStep === 'kadep';

type DialogTarget =
  | { kind: 'single'; request: ThesisChangeRequest; state: ChangeDecisionDialogState }
  | { kind: 'batch'; batchId: string; state: ChangeDecisionDialogState };

function RequestRow({ request, canDecide, onDecide }: {
  request: ThesisChangeRequest;
  canDecide: boolean;
  onDecide: (request: ThesisChangeRequest, approve: boolean) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 font-medium truncate" title={request.student?.name ?? ''}>
          {toTitleCaseName(request.student?.name) || '-'}
          <span className="font-normal text-muted-foreground"> · {request.student?.identityNumber ?? '-'}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <ThesisChangeRequestTypeBadge request={request} />
          <ThesisChangeRequestStatusBadge status={request.status} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ThesisChangeRequestSummary request={request} />
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Langkah persetujuan</p>
          <ThesisChangeRequestSteps request={request} />
        </div>
      </div>
      {request.supervisor && <SupervisorLoadNote load={request.newSupervisorLoad} name={request.supervisor.next?.name} />}
      <ThesisChangeRequestMeta request={request} />
      {canDecide && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          {!lecturerStepsDone(request) && (
            <span className="text-xs text-amber-700">
              Langkah dosen belum selesai. Anda tetap dapat memutuskan langsung dengan alasan.
            </span>
          )}
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => onDecide(request, false)}>Tolak</Button>
          <Button size="sm" onClick={() => onDecide(request, true)}>Setujui</Button>
        </div>
      )}
    </div>
  );
}

/**
 * Ketua Departemen: Pengajuan Perubahan Tugas Akhir, tabs "Menunggu Keputusan" and
 * "Riwayat". Every row shows before/after, the reason, the lecturer steps and the new
 * supervisor's load. Requests of one batch are grouped and can be decided together.
 */
export function KadepThesisChangeRequestPanel() {
  const [scope, setScope] = useState<Scope>('pending');
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch();
  const [dialog, setDialog] = useState<DialogTarget | null>(null);

  const { data, isLoading, isFetching, isPlaceholderData } = useDepartmentChangeRequests({ scope, search: debouncedSearch, page, pageSize: PAGE_SIZE });
  const decision = useKadepDecision();
  const batchDecision = useKadepBatchDecision();
  const groups = useMemo(() => groupByBatch(data?.data ?? []), [data?.data]);

  const openSingle = (request: ThesisChangeRequest, approve: boolean) => {
    const student = toTitleCaseName(request.student?.name) || 'mahasiswa';
    const direct = !lecturerStepsDone(request);
    setDialog({
      kind: 'single',
      request,
      state: approve
        ? {
          approve: true,
          title: 'Setujui pengajuan?',
          description: `Perubahan untuk ${student} langsung diterapkan ke tugas akhirnya.`,
          notesRequired: direct,
          notesHint: direct ? 'Langkah dosen belum selesai: alasan memutuskan langsung wajib diisi.' : undefined,
        }
        : { approve: false, title: 'Tolak pengajuan?', description: `Pengajuan perubahan untuk ${student} ditutup tanpa perubahan.` },
    });
  };

  const openBatch = (batchId: string, requests: ThesisChangeRequest[], approve: boolean) => {
    const direct = requests.some((request) => !lecturerStepsDone(request));
    setDialog({
      kind: 'batch',
      batchId,
      state: approve
        ? {
          approve: true,
          title: `Setujui ${requests.length} pengajuan?`,
          description: 'Semua pengajuan yang masih menunggu pada kelompok ini disetujui dan langsung diterapkan.',
          notesRequired: direct,
          notesHint: direct ? 'Ada langkah dosen yang belum selesai: alasan memutuskan langsung wajib diisi.' : undefined,
        }
        : {
          approve: false,
          title: `Tolak ${requests.length} pengajuan?`,
          description: 'Semua pengajuan yang masih menunggu pada kelompok ini ditolak dengan alasan yang sama.',
        },
    });
  };

  const tabs = [
    { value: 'pending', label: 'Menunggu Keputusan' },
    { value: 'history', label: 'Riwayat' },
  ];
  const totalPages = data?.meta.totalPages ?? 1;
  const isSubmitting = decision.isPending || batchDecision.isPending;

  return (
    <Card className="p-4">
      <CardContent className="space-y-3 p-0">
        <LocalTabsNav tabs={tabs} activeTab={scope} onTabChange={(value) => { setScope(value as Scope); setPage(1); }} />
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Cari nama, NIM, atau judul..."
          isSearching={isFetching && !isLoading}
        />

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : groups.length === 0 ? (
          <EmptyState
            size="sm"
            title="Tidak Ada Data"
            description={scope === 'pending' ? 'Tidak ada pengajuan perubahan yang menunggu keputusan.' : 'Belum ada pengajuan perubahan yang ditutup.'}
            className="py-8"
          />
        ) : (
          <div className={cn('space-y-4', isPlaceholderData && STALE_RESULT_CLASS)}>
            {groups.map((group) => {
              const isBatch = !!group.batchId && group.requests.length > 1;
              const rows = group.requests.map((request) => (
                <RequestRow key={request.id} request={request} canDecide={scope === 'pending'} onDecide={openSingle} />
              ));
              if (!isBatch) return <div key={group.requests[0].id}>{rows}</div>;
              const from = toTitleCaseName(group.requests[0].supervisor?.replaced?.name) || '-';
              const to = toTitleCaseName(group.requests[0].supervisor?.next?.name) || '-';
              return (
                <div key={group.batchId} className="space-y-3 rounded-lg border border-dashed bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm">
                      <span className="font-medium">Alihkan Mahasiswa</span>
                      <span className="text-muted-foreground"> · {group.requests.length} mahasiswa · {from} → {to}</span>
                    </p>
                    {scope === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openBatch(group.batchId!, group.requests, false)}>Tolak Semua</Button>
                        <Button size="sm" onClick={() => openBatch(group.batchId!, group.requests, true)}>Setujui Semua</Button>
                      </div>
                    )}
                  </div>
                  {rows}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Halaman {page} dari {totalPages} · {data?.meta.total ?? 0} pengajuan</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Berikutnya</Button>
            </div>
          </div>
        )}
      </CardContent>

      <ThesisChangeRequestDecisionDialog
        state={dialog?.state ?? null}
        isSubmitting={isSubmitting}
        onClose={() => setDialog(null)}
        onSubmit={({ approve, notes }) => {
          if (!dialog) return;
          const done = { onSuccess: () => setDialog(null) };
          if (dialog.kind === 'single') decision.mutate({ requestId: dialog.request.id, approve, notes }, done);
          else batchDecision.mutate({ batchId: dialog.batchId, approve, notes }, done);
        }}
      />
    </Card>
  );
}
