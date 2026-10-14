import { lazy, Suspense } from 'react';

import { Loading } from '@/components/ui/spinner';
import { useRole } from '@/hooks/shared/useRole';

const StudentThesisProposalPage = lazy(() => import('./StudentThesisProposal'));
const LecturerThesisProposalPage = lazy(() => import('./LecturerThesisProposal'));

/** /tugas-akhir/proposal: the student page, or the supervisor page with "Nilai Proposal" (plan 6). */
export default function ThesisProposalEntry() {
  const { isStudent, isPembimbing, isDosen } = useRole();
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loading size="lg" text="Memuat..." /></div>}>
      {isStudent() ? (
        <StudentThesisProposalPage />
      ) : isPembimbing() || isDosen() ? (
        <LecturerThesisProposalPage />
      ) : (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <p className="text-sm text-muted-foreground">Halaman Proposal untuk peran Anda belum tersedia.</p>
        </div>
      )}
    </Suspense>
  );
}
