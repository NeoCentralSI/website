import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { getStudentSupervisors } from '@/services/studentGuidance.service';
import { ChangeRequestApprovedAlert, useHasApprovedChangeRequest } from '@/components/tugas-akhir/student/ChangeRequestApprovedAlert';
import { ThesisDeletedAlert, useHasThesisDeleted } from '@/components/tugas-akhir/student/ThesisDeletedAlert';
import { Loading } from '@/components/ui/spinner';
import CompletedGuidanceHistory from '@/components/thesis/CompletedGuidanceHistory';

export default function CompletedHistoryPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const breadcrumb = useMemo(
    () => [{ label: 'Tugas Akhir' }, { label: 'Bimbingan', href: '/tugas-akhir/bimbingan/student' }, { label: 'Riwayat' }],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  // Check if student has thesis
  const { data: supervisorsData, isLoading } = useQuery({
    queryKey: ['student-supervisors'],
    queryFn: getStudentSupervisors,
  });

  const thesisId = supervisorsData?.thesisId ?? '';
  const hasNoThesis = !thesisId && !isLoading;

  // Check if student has approved change request (thesis deleted via change request)
  const { hasApprovedRequest } = useHasApprovedChangeRequest();
  
  // Check if student's thesis was deleted (e.g., due to FAILED status)
  const { hasDeletedThesis } = useHasThesisDeleted();

  return (
    <div className="p-4">
      <TabsNav
        preserveSearch
        tabs={[
          { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/student', end: true },
          { label: 'Pembimbing', to: '/tugas-akhir/bimbingan/supervisors' },
          { label: 'Tugas Akhir Saya', to: '/tugas-akhir/bimbingan/milestone' },
          { label: 'Riwayat', to: '/tugas-akhir/bimbingan/completed-history' },
        ]}
      />

      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data..." />
        </div>
      ) : hasNoThesis && hasApprovedRequest ? (
        <ChangeRequestApprovedAlert className="mt-4" />
      ) : hasNoThesis && hasDeletedThesis ? (
        <ThesisDeletedAlert className="mt-4" />
      ) : (
        <CompletedGuidanceHistory />
      )}
    </div>
  );
}
