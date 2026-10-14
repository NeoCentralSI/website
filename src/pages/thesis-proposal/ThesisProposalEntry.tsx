import { lazy, Suspense } from 'react';

import { Loading } from '@/components/ui/spinner';
import { useRole } from '@/hooks/shared/useRole';

const StudentThesisProposalPage = lazy(() => import('./StudentThesisProposal'));

/** /tugas-akhir/proposal: the student page; the supervisor page follows in a later stage. */
export default function ThesisProposalEntry() {
  const { isStudent } = useRole();
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loading size="lg" text="Memuat..." /></div>}>
      {isStudent() ? (
        <StudentThesisProposalPage />
      ) : (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <p className="text-sm text-muted-foreground">Halaman Proposal untuk peran Anda belum tersedia.</p>
        </div>
      )}
    </Suspense>
  );
}
