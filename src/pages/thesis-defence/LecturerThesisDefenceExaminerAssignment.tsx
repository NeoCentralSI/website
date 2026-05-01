import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { LecturerThesisDefenceExaminerAssignmentTable } from '@/components/thesis-defence/LecturerThesisDefenceExaminerAssignmentTable';

export default function LecturerThesisDefenceExaminerAssignment() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

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

  const tabs = [
    { label: 'Mahasiswa Bimbingan', to: '/tugas-akhir/sidang/lecturer/my-students', end: true },
    { label: 'Menguji Mahasiswa', to: '/tugas-akhir/sidang/lecturer/examiner-requests', end: true },
    { label: 'Tetapkan Penguji', to: '/tugas-akhir/sidang/lecturer/assignment', end: true },
  ];

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tetapkan Penguji</h1>
        <p className="text-gray-500">Tetapkan dosen penguji untuk sidang mahasiswa</p>
      </div>

      <TabsNav tabs={tabs} />

      <LecturerThesisDefenceExaminerAssignmentTable />
    </div>
  );
}
