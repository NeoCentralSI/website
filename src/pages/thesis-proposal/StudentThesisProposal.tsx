import { useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { PageHeading } from '@/components/shared/PageHeading';
import { StudentProposalFileCard } from '@/components/thesis-proposal/StudentProposalFileCard';
import { StudentProposalInfoCard } from '@/components/thesis-proposal/StudentProposalInfoCard';
import { StudentProposalStatusCard } from '@/components/thesis-proposal/StudentProposalStatusCard';
import { StudentSupervisorRequestCard } from '@/components/thesis-proposal/StudentSupervisorRequestCard';
import { StudentSupervisorRequestHistoryTable } from '@/components/thesis-proposal/StudentSupervisorRequestHistoryTable';
import { buildProposalSteps } from '@/components/thesis-proposal/studentProposalState';
import { Skeleton } from '@/components/ui/skeleton';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { useMySupervisorRequests } from '@/hooks/thesis-proposal/useSupervisorRequests';
import { useMyProposalOverview } from '@/hooks/thesis-proposal/useSupervisorAssignment';

const TABS = [
  { value: 'ringkasan', label: 'Ringkasan' },
  { value: 'riwayat-pengajuan', label: 'Riwayat Pengajuan Pembimbing' },
];

/**
 * Tugas Akhir > Proposal (mahasiswa; Paket P9, 2), in the form of Seminar Hasil: title and
 * subtitle, then two panels. Ringkasan: Informasi Proposal (once there is a request), then the
 * stepper beside the Pengajuan Pembimbing and Proposal Final (or Proposal Revisi) cards. The
 * request form is its own page (/tugas-akhir/proposal/pengajuan).
 */
export default function StudentThesisProposal() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'riwayat-pengajuan' ? 'riwayat-pengajuan' : 'ringkasan';
  const requests = useMySupervisorRequests();
  const overview = useMyProposalOverview();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Tugas Akhir', href: '/tugas-akhir' }, { label: 'Proposal' }]);
    setTitle('Proposal');
  }, [setBreadcrumbs, setTitle]);

  const repeating = overview.data?.proposalRevision.applicable ?? false;
  const error = requests.error ?? overview.error;

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Proposal" subtitle="Pengajuan pembimbing, proposal final, dan penilaian proposal Anda" />
      <LocalTabsNav tabs={TABS} activeTab={tab} onTabChange={(value) => setSearchParams(value === 'ringkasan' ? {} : { tab: value }, { replace: true })} />

      {tab === 'riwayat-pengajuan' ? (
        <StudentSupervisorRequestHistoryTable requests={requests.data?.requests ?? []} isLoading={requests.isLoading} />
      ) : requests.isLoading || overview.isLoading ? (
        <div className="space-y-[14px]">
          <Skeleton className="h-[120px] w-full" />
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-[260px_1fr]">
            <Skeleton className="h-[320px]" />
            <Skeleton className="h-[320px]" />
          </div>
        </div>
      ) : error || !requests.data ? (
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Gagal memuat data proposal.'}</p>
      ) : (
        <div className="flex flex-col gap-[14px]">
          <StudentProposalInfoCard overview={overview.data} requests={requests.data} />
          <div className="grid grid-cols-1 items-start gap-[14px] md:grid-cols-[260px_1fr]">
            <div className="self-stretch">
              <StudentProposalStatusCard steps={buildProposalSteps(overview.data, requests.data)} />
            </div>
            <div className="flex flex-col gap-[14px]">
              <StudentSupervisorRequestCard data={requests.data} />
              {overview.data && <StudentProposalFileCard overview={overview.data} kind={repeating ? 'revision' : 'final'} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
