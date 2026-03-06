import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { DefenceSupervisedStudentTable } from '@/components/sidang/DefenceSupervisedStudentTable';
import { useRole } from '@/hooks/shared/useRole';

export default function LecturerSupervisedStudentDefences() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isKadep } = useRole();

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir' },
      { label: 'Sidang' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const tabs = useMemo(() => {
    const t = [
      { label: 'Mahasiswa Bimbingan', to: '/tugas-akhir/sidang/lecturer/my-students', end: true },
      { label: 'Menguji Mahasiswa', to: '/tugas-akhir/sidang/lecturer/examiner-requests', end: true },
    ];
    if (isKadep()) {
      t.push({ label: 'Tetapkan Penguji', to: '/tugas-akhir/sidang/lecturer/assignment', end: true });
    }
    return t;
  }, [isKadep]);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mahasiswa Bimbingan</h1>
        <p className="text-gray-500">Sidang mahasiswa yang Anda bimbing</p>
      </div>

      <TabsNav tabs={tabs} />

      <DefenceSupervisedStudentTable />
    </div>
  );
}
