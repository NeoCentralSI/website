import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { StudentFinalProposalSection } from '@/components/thesis-proposal/StudentFinalProposalSection';
import { StudentResearchMethodScoreSection } from '@/components/thesis-proposal/StudentResearchMethodScoreSection';
import { StudentSupervisorAssignmentSection } from '@/components/thesis-proposal/StudentSupervisorAssignmentSection';
import { StudentSupervisorRequestSection } from '@/components/thesis-proposal/StudentSupervisorRequestSection';

/**
 * Tugas Akhir > Proposal (mahasiswa, K14). Bagian berurutan: Pengajuan Pembimbing, Penetapan
 * Pembimbing, Proposal final, Nilai Metode Penelitian. Halaman selalu bisa dibuka; aksi yang
 * belum boleh tampil nonaktif dengan alasannya.
 */
export default function StudentThesisProposal() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Tugas Akhir', href: '/tugas-akhir' }, { label: 'Proposal' }]);
    setTitle('Proposal');
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <StudentSupervisorRequestSection />
      <StudentSupervisorAssignmentSection />
      <StudentFinalProposalSection />
      <StudentResearchMethodScoreSection />
    </div>
  );
}
