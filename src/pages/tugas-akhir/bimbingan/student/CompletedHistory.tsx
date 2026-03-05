import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import CompletedGuidanceHistory from '@/components/thesis/CompletedGuidanceHistory';
import { useQuery } from '@tanstack/react-query';
import { getStudentSupervisors } from '@/services/studentGuidance.service';

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

  const isThesisInactive = thesisDetail?.status === "Gagal" || thesisDetail?.status === "Dibatalkan" || thesisDetail?.status === "Selesai";

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Riwayat Bimbingan</h1>
          <p className="text-gray-500">Arsip seluruh kegiatan bimbingan</p>
        </div>
      </div>

      <TabsNav
        preserveSearch
        tabs={[
          { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/student', end: true },
          { label: 'Milestone', to: '/tugas-akhir/bimbingan/milestone' },
        ]}
      />

      {isThesisInactive ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
          <h3 className="text-lg font-semibold mb-2">Tugas Akhir Tidak Aktif</h3>
          <p className="text-muted-foreground">Status tugas akhir Anda saat ini adalah <strong>{thesisDetail?.status}</strong>. Anda tidak dapat mengakses riwayat bimbingan.</p>
        </div>
      ) : (
        <CompletedGuidanceHistory />
      )}
    </div>
  );
}
