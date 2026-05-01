import { useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { useRole } from '@/hooks/shared/useRole';
import { LecturerThesisDefenceSupervisorPanel } from '@/components/thesis-defence/LecturerThesisDefenceSupervisorPanel';
import { LecturerThesisDefenceExaminerPanel } from '@/components/thesis-defence/LecturerThesisDefenceExaminerPanel';
import { LecturerThesisDefenceAssignExaminerPanel } from '@/components/thesis-defence/LecturerThesisDefenceAssignExaminerPanel';

export default function LecturerThesisDefence() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isKadep } = useRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'mahasiswa-bimbingan';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const activeLabel = useMemo(() => {
    if (activeTab === 'mahasiswa-bimbingan') return 'Mahasiswa Bimbingan';
    if (activeTab === 'menguji-mahasiswa') return 'Menguji Mahasiswa';
    if (activeTab === 'tetapkan-penguji') return 'Tetapkan Penguji';
    return 'Sidang';
  }, [activeTab]);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Sidang', href: '/tugas-akhir/sidang' },
      { label: activeLabel },
    ],
    [activeLabel]
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Sidang Tugas Akhir');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const tabs = useMemo(() => {
    const t = [
      { label: 'Mahasiswa Bimbingan', value: 'mahasiswa-bimbingan' },
      { label: 'Menguji Mahasiswa', value: 'menguji-mahasiswa' },
    ];
    if (isKadep()) {
      t.push({ label: 'Tetapkan Penguji', value: 'tetapkan-penguji' });
    }
    return t;
  }, [isKadep]);

  const renderPanel = () => {
    if (activeTab === 'mahasiswa-bimbingan') {
      return <LecturerThesisDefenceSupervisorPanel />;
    }
    if (activeTab === 'menguji-mahasiswa') {
      return <LecturerThesisDefenceExaminerPanel />;
    }
    if (activeTab === 'tetapkan-penguji') {
      return isKadep() ? <LecturerThesisDefenceAssignExaminerPanel /> : <LecturerThesisDefenceExaminerPanel />;
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sidang Tugas Akhir</h1>
        <p className="text-muted-foreground">Pantau mahasiswa bimbingan, respon penugasan penguji, dan kelola penilaian sidang</p>
      </div>

      <LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      {renderPanel()}
    </div>
  );
}
