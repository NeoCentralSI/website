import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
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
          { label: 'Riwayat', to: '/tugas-akhir/bimbingan/completed-history' },
          { label: 'Zona Berbahaya', to: '/tugas-akhir/bimbingan/danger-zone' },
        ]}
      />

      <CompletedGuidanceHistory />
    </div>
  );
}
