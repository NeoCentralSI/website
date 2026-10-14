import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { SupervisionLoadBadge } from '@/components/shared/SupervisionLoadBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EmptyState from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { Textarea } from '@/components/ui/textarea';
import { useSetAcceptingRequests } from '@/hooks/thesis-proposal/useSupervisionQuota';
import {
  useLecturerSupervisorInbox,
  useMarkSupervisorRequestUnderReview,
  useRespondSupervisorRequest,
} from '@/hooks/thesis-proposal/useSupervisorRequests';
import type { SupervisorRequest } from '@/types/thesis-proposal.types';
import { SupervisorRequestDetails } from './SupervisorRequestDetails';

type Dialogs = { request: SupervisorRequest; action: 'accept' | 'reject' } | null;

/** Decision dialog: accept (with the over-limit consideration when the lecturer is full) or reject. */
function ResponseDialog({ state, isFull, onClose }: { state: Dialogs; isFull: boolean; onClose: () => void }) {
  const respond = useRespondSupervisorRequest();
  const [text, setText] = useState('');
  if (!state) return null;
  const accept = state.action === 'accept';
  const needsReason = accept && isFull;
  const min = accept ? (needsReason ? 10 : 0) : 5;
  const disabledReason = text.trim().length < min ? `Isi minimal ${min} karakter.` : null;

  const submit = () => {
    const dto = accept
      ? { action: 'accept' as const, approvalNote: needsReason ? null : text || null, lecturerOverquotaReason: needsReason ? text : null }
      : { action: 'reject' as const, rejectionReason: text };
    respond.mutate({ id: state.request.id, dto }, { onSuccess: () => { setText(''); onClose(); } });
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{accept ? 'Terima Permohonan Pembimbing' : 'Tolak Permohonan Pembimbing'}</DialogTitle>
          <DialogDescription>
            {accept
              ? needsReason
                ? 'Anda sudah mencapai batas bimbingan. Penerimaan diteruskan ke Ketua Departemen beserta pertimbangan Anda (misal proyeksi kelulusan).'
                : 'Mahasiswa menjadi bimbingan Anda (Pembimbing 1) dan menunggu Penetapan Pembimbing.'
              : 'Alasan penolakan dikirim ke mahasiswa. Draf mahasiswa tetap tersimpan.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="supervisor-request-text">
            {accept ? (needsReason ? 'Pertimbangan menerima di atas batas (minimal 10 karakter)' : 'Catatan untuk mahasiswa (opsional)') : 'Alasan penolakan (minimal 5 karakter)'}
          </Label>
          <Textarea id="supervisor-request-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <span title={disabledReason ?? undefined}>
            <Button variant={accept ? 'default' : 'destructive'} disabled={Boolean(disabledReason) || respond.isPending} onClick={submit}>
              {respond.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {accept ? (needsReason ? 'Teruskan ke Ketua Departemen' : 'Terima') : 'Tolak'}
            </Button>
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Panel "Permohonan Pembimbing" di atas daftar Mahasiswa Bimbingan (K16): permohonan yang
 * menunggu keputusan dosen, beban bimbingannya, dan riwayat.
 */
export function LecturerSupervisorRequestPanel() {
  const { data, isLoading, error } = useLecturerSupervisorInbox();
  const markReview = useMarkSupervisorRequestUnderReview();
  const accepting = useSetAcceptingRequests();
  const [tab, setTab] = useState<'waiting' | 'history'>('waiting');
  const [dialog, setDialog] = useState<Dialogs>(null);

  if (isLoading) return null;
  if (error || !data) return null;
  const isFull = data.load.level === 'full';
  const list = tab === 'waiting' ? data.waiting : data.history;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Permohonan Pembimbing</CardTitle>
            <CardDescription>Mahasiswa yang mengajukan Anda sebagai pembimbing. Semester {data.academicYear.label}.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">Beban bimbingan</span>
            <SupervisionLoadBadge activeCount={data.load.activeCount} hardLimit={data.load.hardLimit} level={data.load.level} />
            <label className="flex items-center gap-2">
              <Switch
                checked={data.load.acceptingRequests}
                disabled={accepting.isPending}
                onCheckedChange={(checked) => accepting.mutate(checked)}
                aria-label="Menerima pengajuan baru"
              />
              <span className="text-muted-foreground">Menerima pengajuan baru</span>
            </label>
          </div>
        </div>
        <LocalTabsNav
          tabs={[
            { value: 'waiting', label: 'Menunggu Keputusan', badge: data.waiting.length },
            { value: 'history', label: 'Riwayat' },
          ]}
          activeTab={tab}
          onTabChange={(value) => setTab(value as 'waiting' | 'history')}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {list.length === 0 ? (
          <EmptyState size="sm" title="Tidak Ada Data" description={tab === 'waiting' ? 'Tidak ada permohonan yang menunggu keputusan Anda.' : 'Belum ada riwayat permohonan.'} />
        ) : (
          list.map((request) => (
            <div key={request.id} className="rounded-lg border p-3">
              <SupervisorRequestDetails
                request={request}
                showStudent
                actions={tab === 'waiting' && (
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
                    {isFull && <p className="mr-auto text-xs text-muted-foreground">Anda sudah mencapai batas bimbingan; menerima berarti meneruskan ke Ketua Departemen.</p>}
                    {request.status === 'pending' && (
                      <Button size="sm" variant="ghost" disabled={markReview.isPending} onClick={() => markReview.mutate(request.id)}>Tandai Sedang Ditinjau</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setDialog({ request, action: 'reject' })}>Tolak</Button>
                    <Button size="sm" onClick={() => setDialog({ request, action: 'accept' })}>{isFull ? 'Terima dan Teruskan' : 'Terima'}</Button>
                  </div>
                )}
              />
            </div>
          ))
        )}
      </CardContent>
      <ResponseDialog state={dialog} isFull={isFull} onClose={() => setDialog(null)} />
    </Card>
  );
}
