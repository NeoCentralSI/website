import type { ReactNode } from 'react';

import { SupervisorRequestStatusBadge } from '@/components/shared/SupervisorRequestStatusBadge';
import { Badge } from '@/components/ui/badge';
import { formatDateTimeWib, formatLecturerName, toTitleCaseName } from '@/lib/text';
import { getSupervisorRequestRouteLabel } from '@/lib/thesisLabels';
import type { SupervisorRequest } from '@/types/thesis-proposal.types';

const PERMIT_LABELS: Record<string, string> = {
  approved: 'Sudah disetujui',
  in_process: 'Sedang diproses',
  not_approved: 'Belum disetujui',
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[11rem_1fr]">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

function Note({ title, text }: { title: string; text: string | null }) {
  if (!text) return null;
  return (
    <div className="rounded-md border bg-muted/40 p-3 text-sm">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 whitespace-pre-line">{text}</p>
    </div>
  );
}

/**
 * Isi satu Pengajuan Pembimbing untuk semua peran: judul, topik, jalur, dosen, isian
 * mahasiswa, dan catatan keputusan. `showStudent` dipakai di sisi dosen dan Kadep.
 */
export function SupervisorRequestDetails({
  request,
  showStudent = false,
  showContent = true,
  actions,
}: {
  request: SupervisorRequest;
  showStudent?: boolean;
  showContent?: boolean;
  actions?: ReactNode;
}) {
  const supervisorLabel = request.redirectTarget ? 'Dosen ditetapkan Kadep' : 'Dosen pembimbing';
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {showStudent && (
            <p className="font-medium">
              {toTitleCaseName(request.student?.fullName) || '-'}
              <span className="font-normal text-muted-foreground"> · {request.student?.identityNumber ?? '-'}</span>
            </p>
          )}
          <p className={showStudent ? 'text-sm' : 'font-medium'}>{request.proposedTitle ?? '-'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{getSupervisorRequestRouteLabel(request.route)}</Badge>
          <SupervisorRequestStatusBadge status={request.status} />
        </div>
      </div>
      <dl className="space-y-2">
        <Row label="Topik">
          {request.topic?.name ?? '-'}
          {request.topic?.scienceGroup?.name ? <span className="text-muted-foreground"> · {request.topic.scienceGroup.name}</span> : null}
        </Row>
        <Row label={supervisorLabel}>
          {request.supervisor ? formatLecturerName(request.supervisor.fullName) : 'Ditetapkan departemen'}
          {request.redirectTarget && request.lecturer ? (
            <span className="text-muted-foreground"> (pilihan mahasiswa: {formatLecturerName(request.lecturer.fullName)})</span>
          ) : null}
        </Row>
        <Row label="Periode">
          {request.academicYear?.label ?? '-'}
          {request.isCurrentPeriod === false ? <Badge variant="warning" className="ml-2">Periode lalu</Badge> : null}
        </Row>
        <Row label="Dikirim">{formatDateTimeWib(request.createdAt)}</Row>
        {request.acceptedOverNormal && <Row label="Catatan beban">Disetujui di atas batas bimbingan</Row>}
      </dl>
      {showContent && (
        <dl className="space-y-2 border-t pt-3">
          <Row label="Latar belakang">{request.backgroundSummary ?? '-'}</Row>
          <Row label="Rumusan masalah">{request.problemStatement ?? '-'}</Row>
          <Row label="Rencana solusi">{request.proposedSolution ?? '-'}</Row>
          <Row label="Objek penelitian">{request.researchObject ?? '-'}</Row>
          <Row label="Izin penelitian">{PERMIT_LABELS[request.researchPermitStatus ?? ''] ?? '-'}</Row>
        </dl>
      )}
      <div className="space-y-2">
        <Note title="Alasan mahasiswa memilih dosen ini" text={request.studentJustification} />
        <Note title={`Pertimbangan dosen${request.forwardedToKadepAt ? ` (diteruskan ${formatDateTimeWib(request.forwardedToKadepAt)})` : ''}`} text={request.lecturerOverquotaReason} />
        {!request.lecturerOverquotaReason && <Note title="Catatan dosen" text={request.lecturerApprovalNote} />}
        <Note title="Alasan penolakan dosen" text={request.rejectionReason} />
        <Note title={`Catatan Ketua Departemen${request.reviewedAt ? ` (${formatDateTimeWib(request.reviewedAt)})` : ''}`} text={request.kadepNotes} />
      </div>
      {actions}
    </div>
  );
}
