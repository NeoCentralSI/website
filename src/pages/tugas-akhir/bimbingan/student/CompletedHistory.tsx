import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import CompletedGuidanceHistory from '@/components/thesis/CompletedGuidanceHistory';
import { useQuery } from '@tanstack/react-query';
import { getStudentSupervisors } from '@/services/studentGuidance.service';
import { getThesisStatusLabel } from '@/lib/thesisLabels';
import { ThesisClosedAlert } from '@/components/thesis/ThesisClosedAlert';

export default function CompletedHistoryPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const breadcrumb = useMemo(
    () => [{ label: 'Tugas Akhir' }, { label: 'Bimbingan', href: '/tugas-akhir/bimbingan/student' }, { label: 'Riwayat' }],
    []
  );

  const { data: supervisorsData, error: supervisorsError } = useQuery({
    queryKey: ["student-supervisors"],
    queryFn: getStudentSupervisors,
  });

  const thesisId = supervisorsData?.thesisId || "";
  const hasThesis = !supervisorsError && !!thesisId;

  const { data: thesisDetail } = useQuery({
    queryKey: ["my-thesis-detail"],
    queryFn: async () => {
      const { getMyThesisDetail } = await import('@/services/studentGuidance.service');
      return getMyThesisDetail();
    },
    enabled: hasThesis,
  });

  // A thesis made Selesai by its defence keeps its history readable (with the
  // closed notice, as on the Bimbingan and Milestone pages); a stopped thesis (Gagal) does not.
  const isThesisInactive = thesisDetail?.status === "failed";
  const isThesisCompleted = thesisDetail?.status === "completed";

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle('Riwayat Bimbingan');
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Riwayat Bimbingan</h1>
        <p className="text-muted-foreground">Arsip seluruh kegiatan bimbingan</p>
      </div>

      <TabsNav
        preserveSearch
        tabs={[
          { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/student', end: true },
          { label: 'Milestone', to: '/tugas-akhir/bimbingan/student/milestone' },
        ]}
      />

      {isThesisInactive ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
          <h3 className="text-lg font-semibold mb-2">Tugas Akhir Tidak Aktif</h3>
          <p className="text-muted-foreground">Status tugas akhir Anda saat ini adalah <strong>{getThesisStatusLabel(thesisDetail?.status)}</strong>. Anda tidak dapat mengakses riwayat bimbingan.</p>
        </div>
      ) : (
        <>
          {isThesisCompleted && <ThesisClosedAlert status="completed" closedAt={thesisDetail?.completedAt} />}
          <CompletedGuidanceHistory />
        </>
      )}
    </div>
  );
}
