import { useState } from 'react';
import { Eye } from 'lucide-react';

import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { TableIconAction } from '@/components/shared/TableIconAction';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCancelChangeRequest, useLecturerDecision } from '@/hooks/thesis-change-request/useThesisChangeRequest';
import { DateTimeCell } from '@/lib/guidanceCells';
import { toTitleCaseName } from '@/lib/text';
import { getChangeRequestStepLabel } from '@/lib/thesisLabels';
import type { ThesisChangeRequest } from '@/types/thesis-change-request.types';
import { ThesisChangeRequestDecisionDialog, type ChangeDecisionDialogState } from './ThesisChangeRequestDecisionDialog';
import {
  SupervisorLoadNote,
  ThesisChangeRequestMeta,
  ThesisChangeRequestStatusBadge,
  ThesisChangeRequestSteps,
  ThesisChangeRequestSummary,
  ThesisChangeRequestTypeBadge,
} from './ThesisChangeRequestParts';

/** "judul", "pembimbing", "judul dan pembimbing", as it reads inside a sentence. */
export function changeRequestKindPhrase(request: ThesisChangeRequest): string {
  if (request.requestType === 'title') return 'judul';
  if (request.requestType === 'both') return 'judul dan pembimbing';
  return 'pembimbing';
}

/** Requests that touched the title, or the supervisors (Paket E4, 6: the two history links). */
export const changesTitle = (request: ThesisChangeRequest) => request.requestType === 'title' || request.requestType === 'both';
export const changesSupervisor = (request: ThesisChangeRequest) => request.requestType === 'supervisor' || request.requestType === 'both';

/** The confirmation of a lecturer's own step (Setujui / Tolak), shared by the detail and Permohonan. */
export function lecturerDecisionDialogState(request: ThesisChangeRequest, approve: boolean): ChangeDecisionDialogState {
  const student = toTitleCaseName(request.student?.name) || 'mahasiswa';
  return approve
    ? { approve: true, title: 'Setujui pengajuan?', description: `Pengajuan perubahan untuk ${student} dilanjutkan ke langkah berikutnya.` }
    : { approve: false, title: 'Tolak pengajuan?', description: `Pengajuan perubahan untuk ${student} ditutup dan tidak diteruskan.` };
}

/**
 * Detail of one request: before/after, reason, the approval steps with status and date. The
 * requester may cancel it; a lecturer whose step is open approves or rejects it here.
 */
export function ThesisChangeRequestDetailDialog({ request, onClose }: { request: ThesisChangeRequest | null; onClose: () => void }) {
  const cancel = useCancelChangeRequest();
  const decision = useLecturerDecision();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [dialog, setDialog] = useState<ChangeDecisionDialogState | null>(null);

  const openDecision = (approve: boolean) => { if (request) setDialog(lecturerDecisionDialogState(request, approve)); };

  return (
    <>
      <RecordDetailDialog
        open={!!request}
        onOpenChange={(open) => { if (!open) onClose(); }}
        title="Detail Pengajuan Perubahan"
        footer={request && (request.viewer.canCancel || request.viewer.canDecideAsLecturer) ? (
          <>
            {request.viewer.canDecideAsLecturer && (
              <>
                <span className="mr-auto text-xs text-muted-foreground">
                  Anda menyetujui sebagai {request.currentStep ? getChangeRequestStepLabel(request.currentStep) : '-'}.
                </span>
                <Button size="sm" variant="outline" onClick={() => openDecision(false)}>Tolak</Button>
                <Button size="sm" onClick={() => openDecision(true)}>Setujui</Button>
              </>
            )}
            {request.viewer.canCancel && (
              <Button size="sm" variant="outline" disabled={cancel.isPending} onClick={() => setConfirmCancel(true)}>
                Batalkan Pengajuan
              </Button>
            )}
          </>
        ) : undefined}
      >
        {request && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <ThesisChangeRequestTypeBadge request={request} />
              <ThesisChangeRequestStatusBadge status={request.status} />
            </div>
            <ThesisChangeRequestSummary request={request} />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Langkah persetujuan</p>
              <ThesisChangeRequestSteps request={request} />
            </div>
            {request.supervisor && <SupervisorLoadNote load={request.newSupervisorLoad} name="Anda" />}
            <ThesisChangeRequestMeta request={request} />
          </>
        )}
      </RecordDetailDialog>

      <ThesisChangeRequestDecisionDialog
        state={dialog}
        isSubmitting={decision.isPending}
        onClose={() => setDialog(null)}
        onSubmit={({ approve, notes }) => {
          if (!request) return;
          decision.mutate({ requestId: request.id, approve, notes }, { onSuccess: () => { setDialog(null); onClose(); } });
        }}
      />

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan pengajuan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengajuan perubahan ini ditutup tanpa keputusan. Anda dapat mengajukan lagi setelahnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (request) cancel.mutate(request.id, { onSuccess: onClose });
              }}
            >
              Batalkan Pengajuan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Mini history table of one thesis: tanggal, jenis, status, Detail (Paket E4, 5 and 6; Paket E5:
 * the table standard, with a fixed layout, a two-line date and the detail as an icon).
 */
export function ThesisChangeRequestMiniTable({ requests, onDetail, emptyText = 'Belum ada riwayat pengajuan.' }: {
  requests: ThesisChangeRequest[];
  onDetail: (request: ThesisChangeRequest) => void;
  emptyText?: string;
}) {
  if (requests.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="table-fixed min-w-[400px]">
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: 120 }}>Tanggal</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead style={{ width: 160 }}>Status</TableHead>
            <TableHead style={{ width: 64 }} className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell><DateTimeCell date={request.decision?.at ?? request.createdAt} /></TableCell>
              <TableCell><ThesisChangeRequestTypeBadge request={request} /></TableCell>
              <TableCell><ThesisChangeRequestStatusBadge status={request.status} /></TableCell>
              <TableCell className="text-center">
                <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => onDetail(request)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** One line for a running request: "Pengajuan perubahan judul menunggu Pembimbing 1 · Lihat detail". */
export function ThesisChangeRequestStatusLine({ request, onDetail }: { request: ThesisChangeRequest; onDetail: () => void }) {
  return (
    <p className="text-sm">
      Pengajuan perubahan {changeRequestKindPhrase(request)} menunggu{' '}
      {request.currentStep ? getChangeRequestStepLabel(request.currentStep) : 'keputusan'}
      {' · '}
      <button type="button" className="font-medium text-primary hover:underline" onClick={onDetail}>
        Lihat detail
      </button>
    </p>
  );
}

/** "Riwayat perubahan judul (N)": a small link that opens the history modal; hidden when N = 0. */
export function ThesisChangeRequestHistoryLink({ label, title, requests }: { label: string; title: string; requests: ThesisChangeRequest[] }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ThesisChangeRequest | null>(null);
  if (requests.length === 0) return null;
  return (
    <>
      <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setOpen(true)}>
        {label} ({requests.length})
      </button>
      <RecordDetailDialog open={open} onOpenChange={setOpen} title={title}>
        <ThesisChangeRequestMiniTable requests={requests} onDetail={setDetail} />
      </RecordDetailDialog>
      <ThesisChangeRequestDetailDialog request={detail} onClose={() => setDetail(null)} />
    </>
  );
}
