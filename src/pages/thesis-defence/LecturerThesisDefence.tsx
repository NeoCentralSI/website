import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { useRole } from '@/hooks/shared/useRole';
import { LecturerThesisDefenceSupervisedStudentsTable } from '@/components/thesis-defence/LecturerThesisDefenceSupervisedStudentsTable';
import { LecturerThesisDefenceExaminerRequestsTable } from '@/components/thesis-defence/LecturerThesisDefenceExaminerRequestsTable';
import { LecturerThesisDefenceExaminerAssignmentTable } from '@/components/thesis-defence/LecturerThesisDefenceExaminerAssignmentTable';

export default function LecturerThesisDefence() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isKadep } = useRole();
  const [activeTab, setActiveTab] = useState('mahasiswa-bimbingan');

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
    setTitle('Sidang');
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
      return <LecturerThesisDefenceSupervisedStudentsTable />;
    }
    if (activeTab === 'menguji-mahasiswa') {
      return <LecturerThesisDefenceExaminerRequestsTable />;
    }
    if (activeTab === 'tetapkan-penguji') {
      return isKadep() ? <LecturerThesisDefenceExaminerAssignmentTable /> : <LecturerThesisDefenceExaminerRequestsTable />;
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sidang</h1>
        <p className="text-gray-500">Pantau mahasiswa bimbingan, respon penugasan penguji, dan kelola penilaian sidang</p>
      </div>

      <LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      {renderPanel()}
    </div>
  );
}
