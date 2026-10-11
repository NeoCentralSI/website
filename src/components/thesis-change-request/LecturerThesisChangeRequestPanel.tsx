import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { useLecturerChangeRequests, useLecturerDecision } from '@/hooks/thesis-change-request/useThesisChangeRequest';
import { toTitleCaseName } from '@/lib/text';
import { getChangeRequestStepLabel } from '@/lib/thesisLabels';
import type { ThesisChangeRequest } from '@/types/thesis-change-request.types';
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

type TabKey = 'awaitingMe' | 'inProgress' | 'history';

const EMPTY_TEXT: Record<TabKey, string> = {
  awaitingMe: 'Tidak ada pengajuan yang menunggu persetujuan Anda.',
  inProgress: 'Tidak ada pengajuan lain yang sedang berjalan.',
  history: 'Belum ada pengajuan yang ditutup.',
};

function RequestRow({ request, onDecide }: {
  request: ThesisChangeRequest;
  onDecide?: (request: ThesisChangeRequest, approve: boolean) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium truncate" title={request.student?.name ?? ''}>
            {toTitleCaseName(request.student?.name) || '-'}
            <span className="font-normal text-muted-foreground"> · {request.student?.identityNumber ?? '-'}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThesisChangeRequestTypeBadge request={request} />
          <ThesisChangeRequestStatusBadge status={request.status} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ThesisChangeRequestSummary request={request} />
        <ThesisChangeRequestSteps request={request} />
      </div>
      <SupervisorLoadNote load={request.newSupervisorLoad} name="Anda" />
      <ThesisChangeRequestMeta request={request} />
      {onDecide && request.viewer.canDecideAsLecturer && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="text-xs text-muted-foreground">
            Anda menyetujui sebagai {request.currentStep ? getChangeRequestStepLabel(request.currentStep) : '-'}.
          </span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => onDecide(request, false)}>Tolak</Button>
          <Button size="sm" onClick={() => onDecide(request, true)}>Setujui</Button>
        </div>
      )}
    </div>
  );
}

/**
 * Supervisor's "Pengajuan Perubahan" section (Tugas Akhir > Bimbingan, tab Mahasiswa):
 * requests waiting for this lecturer's step, the ones still running elsewhere, and the
 * history.
 */
export function LecturerThesisChangeRequestPanel({ className }: { className?: string }) {
  const { data, isLoading } = useLecturerChangeRequests();
  const decision = useLecturerDecision();
  const [tab, setTab] = useState<TabKey>('awaitingMe');
  const [dialog, setDialog] = useState<{ request: ThesisChangeRequest; state: ChangeDecisionDialogState } | null>(null);

  const openDialog = (request: ThesisChangeRequest, approve: boolean) => {
    const student = toTitleCaseName(request.student?.name) || 'mahasiswa';
    setDialog({
      request,
      state: approve
        ? { approve: true, title: 'Setujui pengajuan?', description: `Pengajuan perubahan untuk ${student} dilanjutkan ke langkah berikutnya.` }
        : { approve: false, title: 'Tolak pengajuan?', description: `Pengajuan perubahan untuk ${student} ditutup dan tidak diteruskan.` },
    });
  };

  const rows = data?.[tab] ?? [];
  const tabs = [
    { value: 'awaitingMe', label: `Menunggu Persetujuan Anda (${data?.awaitingMe.length ?? 0})` },
    { value: 'inProgress', label: `Sedang Berjalan (${data?.inProgress.length ?? 0})` },
    { value: 'history', label: 'Riwayat' },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Pengajuan Perubahan</CardTitle>
        <CardDescription>
          Pengajuan Perubahan Tugas Akhir yang melibatkan Anda sebagai pembimbing sebelumnya, pembimbing baru, atau pengaju.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LocalTabsNav tabs={tabs} activeTab={tab} onTabChange={(value) => setTab(value as TabKey)} />
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <EmptyState size="sm" title="Tidak Ada Data" description={EMPTY_TEXT[tab]} className="py-6" />
        ) : (
          <div className="space-y-3">
            {rows.map((request) => (
              <RequestRow key={request.id} request={request} onDecide={tab === 'awaitingMe' ? openDialog : undefined} />
            ))}
          </div>
        )}
      </CardContent>

      <ThesisChangeRequestDecisionDialog
        state={dialog?.state ?? null}
        isSubmitting={decision.isPending}
        onClose={() => setDialog(null)}
        onSubmit={({ approve, notes }) => {
          if (!dialog) return;
          decision.mutate({ requestId: dialog.request.id, approve, notes }, { onSuccess: () => setDialog(null) });
        }}
      />
    </Card>
  );
}
