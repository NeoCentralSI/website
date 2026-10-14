import { useQuery } from '@tanstack/react-query';

import { PendingRequestCard } from '@/components/bimbingan/PendingRequestCard';
import { RequestSupervisor2Dialog } from '@/components/bimbingan/RequestSupervisor2Dialog';
import { ThesisStatusBadge } from '@/components/shared/ThesisStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useMyProposalOverview } from '@/hooks/thesis-proposal/useSupervisorAssignment';
import { formatDateTimeWib, formatLecturerName } from '@/lib/text';
import { getPendingSupervisor2Request } from '@/services/studentGuidance.service';

/**
 * Bagian "Penetapan Pembimbing" pada Tugas Akhir > Proposal: judul, pembimbing, dan status
 * penetapan. Mahasiswa hanya melihat statusnya; PDF penetapan tetap di departemen.
 */
export function StudentSupervisorAssignmentSection() {
  const { data, isLoading, error } = useMyProposalOverview();
  const thesis = data?.thesis ?? null;
  const supervisors = thesis?.supervisors ?? [];
  const hasSupervisor1 = supervisors.some((s) => s.role === 'Pembimbing 1');
  const hasSupervisor2 = supervisors.some((s) => s.role === 'Pembimbing 2');
  const { data: pendingSupervisor2 } = useQuery({
    queryKey: ['pending-supervisor2-request'],
    queryFn: getPendingSupervisor2Request,
    enabled: hasSupervisor1 && !hasSupervisor2,
  });

  if (isLoading) return <div className="flex justify-center py-6"><Spinner className="h-5 w-5" /></div>;
  if (error) return <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Gagal memuat data proposal.'}</p>;
  if (!thesis || !data?.assignment) return null;

  const { assignment } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Penetapan Pembimbing
          {assignment.assigned
            ? <Badge variant="success">Sudah Ditetapkan</Badge>
            : <Badge variant="warning">Menunggu Penetapan</Badge>}
        </CardTitle>
        <CardDescription>
          {assignment.assigned
            ? `Ditetapkan Ketua Departemen pada ${formatDateTimeWib(assignment.assignedAt)}${assignment.semesterLabel ? ` untuk semester ${assignment.semesterLabel}` : ''}.`
            : assignment.waitingReason}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 md:grid-cols-[10rem_1fr]">
          <span className="text-muted-foreground">Judul</span>
          <span className="break-words font-medium">{thesis.title || 'Judul belum ditentukan'}</span>
          <span className="text-muted-foreground">Status Tugas Akhir</span>
          <span><ThesisStatusBadge status={thesis.status} /></span>
          {thesis.topic && (
            <>
              <span className="text-muted-foreground">Topik</span>
              <span>{thesis.topic.name}</span>
            </>
          )}
          <span className="text-muted-foreground">Pembimbing</span>
          <div className="space-y-1">
            {supervisors.length === 0
              ? <span>-</span>
              : supervisors.map((supervisor) => (
                <div key={supervisor.lecturerId}>
                  {formatLecturerName(supervisor.fullName)}
                  {supervisor.role && <span className="text-xs text-muted-foreground"> · {supervisor.role}</span>}
                </div>
              ))}
          </div>
        </div>
        {hasSupervisor1 && !hasSupervisor2 && (
          pendingSupervisor2
            ? <PendingRequestCard request={pendingSupervisor2} />
            : (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed p-3">
                <span className="text-muted-foreground">Belum ada Pembimbing 2? Anda dapat meminta dosen menjadi Pembimbing 2.</span>
                <RequestSupervisor2Dialog hasPembimbing2={hasSupervisor2} hasPendingRequest={Boolean(pendingSupervisor2)} />
              </div>
            )
        )}
      </CardContent>
    </Card>
  );
}
