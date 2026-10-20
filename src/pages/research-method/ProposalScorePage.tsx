import { useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { PARTY_LABEL, ProposalScoreForm } from '@/components/research-method/ProposalScoreForm';
import { PageHeading } from '@/components/shared/PageHeading';
import { ProposalFileChip } from '@/components/thesis-proposal/ProposalFileChip';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAssessmentScoreForm, useSubmitScore } from '@/hooks/research-method/useResearchMethod';
import { formatDateTimeWib, formatLecturerName, toTitleCaseName } from '@/lib/text';
import type { AssessorParty } from '@/types/research-method.types';

const BACK: Record<AssessorParty, { to: string; label: string; crumbs: { label: string; href?: string }[] }> = {
  supervisor: {
    to: '/tugas-akhir/proposal',
    label: 'Kembali ke Proposal',
    crumbs: [{ label: 'Tugas Akhir' }, { label: 'Proposal', href: '/tugas-akhir/proposal' }, { label: 'Nilai Proposal' }],
  },
  coordinator: {
    to: '/metode-penelitian/penilaian',
    label: 'Kembali ke Penilaian Proposal',
    crumbs: [{ label: 'Metode Penelitian' }, { label: 'Penilaian Proposal', href: '/metode-penelitian/penilaian' }, { label: 'Nilai Proposal' }],
  },
};

/**
 * Nilai Proposal of one attempt: Tugas Akhir → Proposal (pembimbing) or Metode Penelitian →
 * Penilaian Proposal (koordinator) opens this page, as the Sidang TA assessment is a page of its own.
 */
export default function ProposalScorePage({ party }: { party: AssessorParty }) {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { assessmentId } = useParams();
  const form = useAssessmentScoreForm(assessmentId, party);
  const submit = useSubmitScore();
  const back = BACK[party];
  const data = form.data;

  useEffect(() => {
    setBreadcrumbs(back.crumbs);
    setTitle('Nilai Proposal');
  }, [back, setBreadcrumbs, setTitle]);

  const student = data?.assessment.student;
  const supervisors = (data?.assessment.thesis.supervisors ?? []).map((s) => `${formatLecturerName(s.fullName)} (${s.role ?? '-'})`).join(' · ');

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title={`Nilai Proposal (${PARTY_LABEL[party]})`}
        subtitle={student ? `${toTitleCaseName(student.fullName) || '-'} · ${student.identityNumber ?? '-'} · ${data?.academicYear.label}` : undefined}
        backTo={back.to}
        backLabel={back.label}
      />

      {form.isLoading ? (
        <div className="flex justify-center py-10"><Spinner className="h-6 w-6" /></div>
      ) : form.error || !data ? (
        <p className="text-sm text-destructive">{form.error instanceof Error ? form.error.message : 'Form penilaian tidak tersedia.'}</p>
      ) : (
        <>
          <Card className="py-4 shadow-none">
            <CardContent className="grid gap-3 text-sm md:grid-cols-[1fr_auto]">
              <dl className="min-w-0 space-y-1.5">
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted-foreground">Judul</dt>
                  <dd className="min-w-0 [overflow-wrap:anywhere]">{data.assessment.thesis.title || 'Judul belum ditentukan'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted-foreground">Pembimbing</dt>
                  <dd className="min-w-0 truncate" title={supervisors}>{supervisors || '-'}</dd>
                </div>
              </dl>
              <div className="flex min-w-0 flex-col items-start gap-1 md:items-end">
                <ProposalFileChip url={data.assessment.proposal?.url} fileName={data.assessment.proposal?.fileName} className="max-w-[260px]" />
                {data.assessment.proposal?.submittedAt && (
                  <span className="text-xs text-muted-foreground">Diajukan {formatDateTimeWib(data.assessment.proposal.submittedAt)}</span>
                )}
              </div>
            </CardContent>
          </Card>

          <ProposalScoreForm
            party={party}
            criteria={data.criteria}
            weight={data.weight}
            minimumScore={data.minimumScore}
            mode="edit"
            assessorName={data.own.name}
            ownStatus={data.own.status}
            ownSubmittedAt={data.own.submittedAt}
            other={data.other}
            blockReason={data.canEdit ? null : data.blockReason}
            pending={submit.isPending}
            onSaveDraft={(scores) => assessmentId && submit.mutate({ id: assessmentId, party, scores, isDraft: true })}
            onSubmit={(scores) => assessmentId && submit.mutate({ id: assessmentId, party, scores, isDraft: false })}
          />
        </>
      )}
    </div>
  );
}
