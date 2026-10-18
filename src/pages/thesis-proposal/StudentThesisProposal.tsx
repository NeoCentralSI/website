import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { PageHeading } from '@/components/shared/PageHeading';
import { StudentFinalProposalSection } from '@/components/thesis-proposal/StudentFinalProposalSection';
import { StudentProposalRevisionSection } from '@/components/thesis-proposal/StudentProposalRevisionSection';
import { StudentResearchMethodScoreSection } from '@/components/thesis-proposal/StudentResearchMethodScoreSection';
import { StudentSupervisorAssignmentSection } from '@/components/thesis-proposal/StudentSupervisorAssignmentSection';
import { StudentSupervisorRequestSection } from '@/components/thesis-proposal/StudentSupervisorRequestSection';

/**
 * Tugas Akhir > Proposal (mahasiswa, K14). Bagian berurutan: Pengajuan Pembimbing, Penetapan
 * Pembimbing, Proposal Revisi (hanya TA yang mengulang proposal), Proposal final, Nilai Metode Penelitian. Halaman selalu bisa dibuka; aksi yang
 * belum boleh tampil nonaktif dengan alasannya. Paket P8: judul halaman di luar kartu; kartu untuk
 * satu objek, riwayat pengajuan sebagai tabel.
 */
export default function StudentThesisProposal() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Tugas Akhir', href: '/tugas-akhir' }, { label: 'Proposal' }]);
    setTitle('Proposal');
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Proposal" subtitle="Pengajuan pembimbing, Penetapan Pembimbing, proposal final, dan Nilai Metode Penelitian Anda" />
      <StudentSupervisorRequestSection />
      <StudentSupervisorAssignmentSection />
      <StudentProposalRevisionSection />
      <StudentFinalProposalSection />
      <StudentResearchMethodScoreSection />
    </div>
  );
}
