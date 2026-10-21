import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronRight, ClipboardCheck, Route, Trophy, Users } from 'lucide-react';

import { PendingRequestCard } from '@/components/bimbingan/PendingRequestCard';
import { RequestSupervisor2Dialog } from '@/components/bimbingan/RequestSupervisor2Dialog';
import { DetailDialogActions } from '@/components/shared/DetailDialogActions';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { ThesisStatusBadge } from '@/components/shared/ThesisStatusBadge';
import { Badge } from '@/components/ui/badge';
import { formatDateShortId, formatDateTimeWib, formatLecturerName } from '@/lib/text';
import {
  getProposalRevisionStatusLabel,
  getProposalRevisionStatusVariant,
  getResearchMethodResultLabel,
  getResearchMethodResultVariant,
  getSupervisorRequestRouteLabel,
} from '@/lib/thesisLabels';
import { cn } from '@/lib/utils';
import { getPendingSupervisor2Request } from '@/services/studentGuidance.service';
import type { FinalProposalAttempt, StudentProposalOverview, StudentSupervisorRequests } from '@/types/thesis-proposal.types';
import { ProposalFileChip } from './ProposalFileChip';
import { SupervisorRequestDetails } from './SupervisorRequestDetails';

function Block({ icon: Icon, label, children }: { icon: typeof Users; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Icon size={12} className="opacity-50" />
        {label}
      </div>
      {children}
    </div>
  );
}

/** "p + k = akhir" of a final attempt (the two parts are sent once the score is final). */
export function formatScoreSum(attempt: FinalProposalAttempt): string {
  if (attempt.supervisorScore != null && attempt.coordinatorScore != null) {
    return `${attempt.supervisorScore} + ${attempt.coordinatorScore} = ${attempt.finalScore}`;
  }
  return String(attempt.finalScore ?? '-');
}

const GRID_COLS = ['grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-2 lg:grid-cols-3', 'sm:grid-cols-2 lg:grid-cols-4', 'sm:grid-cols-2 lg:grid-cols-5'];

/**
 * Row 1 of the student Proposal page, in the form of
 * `StudentThesisSeminarIdentityCard`. Shown once the student has a request (or a thesis);
 * blocks without data are left out. A click opens the full request and the earlier attempts.
 * "Ajukan Pembimbing 2" sits at the bottom left, only while the thesis is in Proposal; once it
 * is in Penelitian the page is a read-only record and Pembimbing 2 is asked from the Overview.
 */
export function StudentProposalInfoCard({ overview, requests }: { overview: StudentProposalOverview | undefined; requests: StudentSupervisorRequests | undefined }) {
  const [open, setOpen] = useState(false);
  const thesis = overview?.thesis ?? null;
  const request = requests?.activeRequest ?? null;
  const supervisors = [...(thesis?.supervisors ?? [])].sort((a, b) => (a.role ?? '').localeCompare(b.role ?? ''));
  const hasSupervisor1 = supervisors.some((s) => s.role === 'Pembimbing 1');
  const hasSupervisor2 = supervisors.some((s) => s.role === 'Pembimbing 2');
  const { data: pendingSupervisor2 } = useQuery({
    queryKey: ['pending-supervisor2-request'],
    queryFn: getPendingSupervisor2Request,
    enabled: hasSupervisor1 && !hasSupervisor2,
  });

  if (!request && !thesis) return null;
  const canAskSupervisor2 = thesis?.status === 'proposal' && hasSupervisor1 && !hasSupervisor2 && !pendingSupervisor2;

  const title = thesis?.title || request?.proposedTitle || null;
  const topic = thesis?.topic?.name ?? request?.topic?.name ?? null;
  const attempts = [overview?.finalProposal.current, ...(overview?.finalProposal.history ?? [])].filter((a): a is FinalProposalAttempt => Boolean(a));
  const scored = attempts.find((attempt) => attempt.isFinalized) ?? null;
  const assignment = overview?.assignment ?? null;
  const revisionHistory = overview?.proposalRevision.applicable
    ? [overview.proposalRevision.current, ...overview.proposalRevision.history].filter((r): r is NonNullable<typeof r> => Boolean(r))
    : [];

  const blocks: ReactNode[] = [];
  if (title) {
    blocks.push(
      <Block key="title" icon={BookOpen} label="Judul">
        <p className="line-clamp-2 text-sm font-medium text-foreground" title={title}>{title}</p>
        {topic && <p className="truncate text-xs text-muted-foreground">{topic}</p>}
      </Block>,
    );
  }
  if (request) {
    blocks.push(
      <Block key="route" icon={Route} label="Jalur Pengajuan">
        <p className="text-sm font-medium text-foreground">{getSupervisorRequestRouteLabel(request.route)}</p>
      </Block>,
    );
  }
  if (supervisors.length > 0) {
    blocks.push(
      <Block key="supervisors" icon={Users} label="Pembimbing">
        {supervisors.map((supervisor, index) => (
          <p key={supervisor.lecturerId} className="truncate text-sm font-medium text-foreground" title={formatLecturerName(supervisor.fullName)}>
            {index + 1}. {formatLecturerName(supervisor.fullName)}
          </p>
        ))}
        {hasSupervisor1 && !hasSupervisor2 && pendingSupervisor2 && (
          <p className="truncate text-xs text-muted-foreground">Pembimbing 2 diminta: {formatLecturerName(pendingSupervisor2.lecturerName ?? '')}</p>
        )}
      </Block>,
    );
  }
  if (assignment && thesis) {
    blocks.push(
      <Block key="assignment" icon={ClipboardCheck} label="Penetapan">
        {assignment.assigned ? (
          <p className="text-sm font-medium text-foreground">
            {assignment.assignedAt ? `Ditetapkan pada ${formatDateShortId(assignment.assignedAt)}` : 'Ditetapkan'}
          </p>
        ) : (
          <p className="text-sm font-medium text-foreground">Menunggu Penetapan</p>
        )}
      </Block>,
    );
  }
  if (scored) {
    blocks.push(
      <Block key="score" icon={Trophy} label="Nilai Metode Penelitian">
        <p className="text-sm font-semibold text-foreground">{formatScoreSum(scored)}</p>
        {scored.result && (
          <Badge variant={getResearchMethodResultVariant(scored.result)} className="w-fit">{getResearchMethodResultLabel(scored.result)}</Badge>
        )}
      </Block>,
    );
  }

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-[10px] border border-gray-200 bg-card p-[16px_18px] transition-all duration-200 hover:border-gray-300/80 hover:bg-gray-50/80 hover:shadow-sm"
      >
        <div className="mb-[14px] flex items-center justify-between gap-2">
          <div className="text-base font-semibold text-foreground">Informasi Proposal</div>
          <div className="flex items-center gap-2">
            {thesis && <ThesisStatusBadge status={thesis.status} />}
            <ChevronRight size={16} className="shrink-0 text-muted-foreground opacity-50" />
          </div>
        </div>
        <div className={cn('grid gap-x-4 gap-y-3', GRID_COLS[Math.max(0, Math.min(blocks.length, 5) - 1)])}>{blocks}</div>
        {canAskSupervisor2 && (
          // The dialog lives in a portal; its clicks must not open this card's modal.
          <div className="mt-[14px] flex justify-start border-t pt-3" onClick={(event) => event.stopPropagation()}>
            <RequestSupervisor2Dialog hasPembimbing2={hasSupervisor2} hasPendingRequest={false} />
          </div>
        )}
      </div>

      <RecordDetailDialog
        open={open}
        onOpenChange={setOpen}
        title="Detail Proposal"
        description={request ? `Dikirim ${formatDateTimeWib(request.createdAt)}` : undefined}
        footer={<DetailDialogActions onClose={() => setOpen(false)} />}
      >
        {request && <SupervisorRequestDetails request={request} />}
        {pendingSupervisor2 && <PendingRequestCard request={pendingSupervisor2} />}
        {attempts.filter((a) => a.isFinalized || a.file).length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-medium">Percobaan Penilaian</p>
            <ul className="divide-y rounded-lg border text-sm">
              {attempts.map((attempt) => (
                <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block font-medium">{attempt.academicYear.label ?? '-'}</span>
                    {attempt.file?.url && <ProposalFileChip url={attempt.file.url} fileName={attempt.file.fileName ?? 'Proposal final'} className="mt-1 max-w-[280px]" />}
                  </span>
                  {attempt.isFinalized && attempt.result ? (
                    <Badge variant={getResearchMethodResultVariant(attempt.result)}>
                      {getResearchMethodResultLabel(attempt.result)} · {formatScoreSum(attempt)}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Belum Final</Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {revisionHistory.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-medium">Proposal Revisi</p>
            <ul className="divide-y rounded-lg border text-sm">
              {revisionHistory.map((revision) => (
                <li key={revision.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <ProposalFileChip url={revision.file.url} fileName={revision.file.fileName} className="max-w-[280px]" />
                  <Badge variant={getProposalRevisionStatusVariant(revision.status)}>{getProposalRevisionStatusLabel(revision.status)}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </RecordDetailDialog>
    </>
  );
}
