import { useState } from 'react';

import { SupervisionLoadBadge } from '@/components/shared/SupervisionLoadBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { useKadepSupervisorQueue } from '@/hooks/thesis-proposal/useSupervisorRequests';
import type { KadepQueue, SupervisorRequest } from '@/types/thesis-proposal.types';
import { KadepSupervisorRequestDecisionDialog, type KadepAction } from './KadepSupervisorRequestDecisionDialog';
import { SupervisorRequestDetails } from './SupervisorRequestDetails';

/**
 * Antrean Ketua Departemen per jalur: "Pengajuan Lewat Departemen" (setujui dengan memilih dosen,
 * minta revisi, tolak) dan "Pengajuan di Atas Kuota" (setujui atau alihkan; tidak bisa ditolak).
 */
export function KadepSupervisorRequestQueue({ route }: { route: 'department' | 'over_quota' }) {
  const { data, isLoading, error } = useKadepSupervisorQueue();
  const [dialog, setDialog] = useState<{ request: SupervisorRequest; action: KadepAction } | null>(null);

  if (isLoading) return <div className="flex justify-center py-10"><Spinner className="h-6 w-6" /></div>;
  if (error || !data) return <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Gagal memuat antrean.'}</p>;

  const isDepartment = route === 'department';
  const waiting: KadepQueue['overQuota'] = isDepartment
    ? data.department.map((request) => ({ ...request, lecturerLoad: null }))
    : data.overQuota;
  const history = data.history.filter((request) => request.route === route);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isDepartment ? 'Pengajuan Lewat Departemen' : 'Pengajuan di Atas Kuota'}</CardTitle>
          <CardDescription>
            {isDepartment
              ? 'Mahasiswa yang meminta departemen menetapkan pembimbing.'
              : 'Dosen bersedia membimbing walaupun sudah mencapai batas bimbingan. Setujui dosen tersebut atau alihkan ke dosen lain.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {waiting.length === 0 ? (
            <EmptyState size="sm" title="Tidak Ada Data" description="Tidak ada pengajuan yang menunggu keputusan." />
          ) : (
            waiting.map((request) => {
              const load = request.lecturerLoad;
              return (
                <div key={request.id} className="rounded-lg border p-3">
                  <SupervisorRequestDetails
                    request={request}
                    showStudent
                    actions={
                      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
                        {load && (
                          <span className="mr-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            Beban dosen sekarang <SupervisionLoadBadge activeCount={load.activeCount} hardLimit={load.hardLimit} level={load.level} />
                            · bila disetujui {load.projectedCount}/{load.hardLimit} (lebih {load.overBy})
                          </span>
                        )}
                        {isDepartment && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setDialog({ request, action: 'reject' })}>Tolak</Button>
                            <Button size="sm" variant="outline" onClick={() => setDialog({ request, action: 'request_revision' })}>Minta Revisi</Button>
                          </>
                        )}
                        {!isDepartment && (
                          <Button size="sm" variant="outline" onClick={() => setDialog({ request, action: 'redirect' })}>Alihkan</Button>
                        )}
                        <Button size="sm" onClick={() => setDialog({ request, action: 'approve' })}>
                          {isDepartment ? 'Tetapkan Pembimbing' : 'Setujui'}
                        </Button>
                      </div>
                    }
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Riwayat Keputusan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {history.map((request) => (
              <div key={request.id} className="rounded-lg border p-3">
                <SupervisorRequestDetails request={request} showStudent showContent={false} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {dialog && <KadepSupervisorRequestDecisionDialog request={dialog.request} action={dialog.action} onClose={() => setDialog(null)} />}
    </div>
  );
}
