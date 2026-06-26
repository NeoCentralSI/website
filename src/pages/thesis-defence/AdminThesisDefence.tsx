import { useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { AdminThesisDefenceVerificationPanel } from '@/components/thesis-defence/AdminThesisDefenceVerificationPanel';
import { AdminThesisDefenceArchivePanel } from '@/components/thesis-defence/AdminThesisDefenceArchivePanel';

export default function AdminThesisDefence() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'verifikasi';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Sidang', href: '/tugas-akhir/sidang' },
      { label: activeTab === 'arsip' ? 'Arsip' : 'Verifikasi' },
    ],
    [activeTab]
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Sidang Tugas Akhir');
  }, [breadcrumbs, setBreadcrumbs, setTitle]);

  const tabs = [
    { label: 'Verifikasi', value: 'verifikasi' },
    { label: 'Arsip', value: 'arsip' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administrasi Sidang Tugas Akhir</h1>
        <p className="text-muted-foreground">Verifikasi berkas pendaftaran mahasiswa dan manajemen arsip sidang tugas akhir</p>
      </div>

      <LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'verifikasi' && <AdminThesisDefenceVerificationPanel />}
      {activeTab === 'arsip' && <AdminThesisDefenceArchivePanel />}
    </div>
  );
}
