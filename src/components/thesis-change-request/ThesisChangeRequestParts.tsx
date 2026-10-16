import { ArrowRight, CheckCircle2, Circle, MinusCircle, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatDateTimeWib, formatLecturerName } from '@/lib/text';
import {
  CHANGE_REQUEST_STATUS_VARIANTS,
  CHANGE_REQUEST_VIEW_STATUS_VARIANTS,
  getChangeRequestStatusLabel,
  getChangeRequestViewStatusLabel,
  getChangeRequestKindLabel,
  getChangeRequestStepLabel,
  getSupervisorPositionLabel,
  type ChangeRequestStatus,
  type ChangeRequestViewStatus,
} from '@/lib/thesisLabels';
import type { ChangeRequestStep, SupervisorLoad, ThesisChangeRequest } from '@/types/thesis-change-request.types';

export function ThesisChangeRequestStatusBadge({ status }: { status: ChangeRequestStatus }) {
  return <Badge variant={CHANGE_REQUEST_STATUS_VARIANTS[status] ?? 'outline'} className="whitespace-nowrap">{getChangeRequestStatusLabel(status)}</Badge>;
}

/** Paket E5 (1.5): the status a row shows this viewer ("Menunggu Persetujuan Anda", "Sedang Berjalan", ...). */
export function ThesisChangeRequestViewStatusBadge({ status }: { status: ChangeRequestViewStatus }) {
  return (
    <Badge variant={CHANGE_REQUEST_VIEW_STATUS_VARIANTS[status] ?? 'outline'} className="whitespace-nowrap">
      {getChangeRequestViewStatusLabel(status)}
    </Badge>
  );
}

export function ThesisChangeRequestTypeBadge({ request }: { request: ThesisChangeRequest }) {
  return <Badge variant="secondary" className="whitespace-nowrap">{getChangeRequestKindLabel(request)}</Badge>;
}

const personName = (person: { name: string | null } | null | undefined) => formatLecturerName(person?.name) || '-';

function stepState(step: ChangeRequestStep, isCurrent: boolean): { icon: React.ReactNode; text: string } {
  if (step.status === 'approved') return { icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, text: 'Disetujui' };
  if (step.status === 'rejected') return { icon: <XCircle className="h-4 w-4 text-red-500" />, text: 'Ditolak' };
  if (step.skipped) return { icon: <MinusCircle className="h-4 w-4 text-muted-foreground" />, text: 'Tidak dijalankan' };
  return {
    icon: <Circle className={isCurrent ? 'h-4 w-4 text-amber-500' : 'h-4 w-4 text-muted-foreground'} />,
    text: isCurrent ? 'Menunggu' : 'Belum giliran',
  };
}

/** The approval chain with the state of each step. */
export function ThesisChangeRequestSteps({ request }: { request: ThesisChangeRequest }) {
  return (
    <ol className="space-y-2" aria-label="Langkah persetujuan">
      {request.steps.map((step) => {
        const state = stepState(step, request.currentStep === step.key);
        return (
          <li key={step.key} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 shrink-0">{state.icon}</span>
            <div className="min-w-0">
              <p>
                <span className="font-medium">{getChangeRequestStepLabel(step.key)}</span>
                {step.lecturer && <span className="text-muted-foreground"> · {personName(step.lecturer)}</span>}
                <span className="text-muted-foreground"> — {state.text}</span>
              </p>
              {(step.notes || step.decidedAt) && (
                <p className="text-xs text-muted-foreground">
                  {step.decidedAt ? formatDateTimeWib(step.decidedAt) : ''}
                  {step.notes ? `${step.decidedAt ? ' · ' : ''}${step.notes}` : ''}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function BeforeAfter({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:gap-2">
        <span className="min-w-0 flex-1 rounded-md bg-muted px-2 py-1 [overflow-wrap:anywhere]">{before}</span>
        <ArrowRight className="hidden h-4 w-4 shrink-0 self-center text-muted-foreground sm:block" aria-label="menjadi" />
        <span className="min-w-0 flex-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 [overflow-wrap:anywhere]">{after}</span>
      </div>
    </div>
  );
}

/** Before / after of what a request changes, and its reason. */
export function ThesisChangeRequestSummary({ request }: { request: ThesisChangeRequest }) {
  return (
    <div className="space-y-3">
      {request.title && (
        <BeforeAfter
          label={request.title.newTopic ? `Judul (topik baru: ${request.title.newTopic.name})` : 'Judul'}
          before={request.title.previous || '(belum ada judul)'}
          after={request.title.next || '-'}
        />
      )}
      {request.supervisor && (
        <BeforeAfter
          label={getSupervisorPositionLabel(request.supervisor.position)}
          before={request.supervisor.replaced ? personName(request.supervisor.replaced) : '(belum ada, ditambahkan)'}
          after={personName(request.supervisor.next)}
        />
      )}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Alasan</p>
        <p className="text-sm whitespace-pre-line [overflow-wrap:anywhere]">{request.reason}</p>
      </div>
    </div>
  );
}

/** Supervision load of the new supervisor. Full is a warning, not a blocker. */
export function SupervisorLoadNote({ load, name }: { load: SupervisorLoad | null | undefined; name?: string | null }) {
  if (!load) return null;
  return (
    <p className={load.isFull ? 'text-xs text-amber-700' : 'text-xs text-muted-foreground'}>
      Beban bimbingan {name ? `${formatLecturerName(name)} ` : ''}saat ini: {load.activeCount} dari {load.quotaMax} mahasiswa.
      {load.isFull ? ' Kuota sudah penuh; keputusan tetap di tangan Ketua Departemen.' : ''}
    </p>
  );
}

/** Who submitted a request and when, plus how it was closed. */
export function ThesisChangeRequestMeta({ request }: { request: ThesisChangeRequest }) {
  return (
    <div className="space-y-1 text-xs text-muted-foreground">
      <p>
        Diajukan {formatDateTimeWib(request.createdAt)} oleh {personName(request.requestedBy)}
        {request.requestedByStudent ? ' (mahasiswa)' : ' (dosen)'}
      </p>
      {request.decision && (
        <p>
          Ditutup {formatDateTimeWib(request.decision.at)} oleh {personName(request.decision.by)}
          {request.decision.notes ? ` · ${request.decision.notes}` : ''}
        </p>
      )}
    </div>
  );
}
