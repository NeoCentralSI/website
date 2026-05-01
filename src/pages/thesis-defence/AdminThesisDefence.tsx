import { useState, useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { AdminThesisDefenceValidationPanel } from '@/components/thesis-defence/AdminThesisDefenceValidationPanel';
import { AdminThesisDefenceArchivePanel } from '@/components/thesis-defence/AdminThesisDefenceArchivePanel';

export default function AdminThesisDefence() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [activeTab, setActiveTab] = useState('validation');

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Sidang TA', href: '/tugas-akhir/sidang' },
      { label: activeTab === 'archive' ? 'Arsip' : 'Validasi' },
    ],
    [activeTab]
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Sidang TA');
  }, [breadcrumbs, setBreadcrumbs, setTitle]);

  const tabs = [
    { label: 'Validasi', value: 'validation' },
    { label: 'Arsip', value: 'archive' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administrasi Sidang TA</h1>
        <p className="text-muted-foreground text-sm">Kelola validasi pendaftaran dan arsip data sidang tugas akhir</p>
      </div>

      <LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'validation' && <AdminThesisDefenceValidationPanel />}
      {activeTab === 'archive' && <AdminThesisDefenceArchivePanel />}
    </div>
  );
}
