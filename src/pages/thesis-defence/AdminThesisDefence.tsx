import { useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { AdminThesisDefenceValidationPanel } from '@/components/thesis-defence/AdminThesisDefenceValidationPanel';
import { AdminThesisDefenceArchivePanel } from '@/components/thesis-defence/AdminThesisDefenceArchivePanel';

export default function AdminThesisDefence() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'validation';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Sidang', href: '/tugas-akhir/sidang' },
      { label: activeTab === 'archive' ? 'Arsip' : 'Validasi' },
    ],
    [activeTab]
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Sidang Tugas Akhir');
  }, [breadcrumbs, setBreadcrumbs, setTitle]);

  const tabs = [
    { label: 'Validasi', value: 'validation' },
    { label: 'Arsip', value: 'archive' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administrasi Sidang TA</h1>
        <p className="text-muted-foreground">Validasi berkas pendaftaran mahasiswa dan manajemen arsip sidang tugas akhir</p>
      </div>

      <LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'validation' && <AdminThesisDefenceValidationPanel />}
      {activeTab === 'archive' && <AdminThesisDefenceArchivePanel />}
    </div>
  );
}
