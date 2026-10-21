import { useEffect, useMemo } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { ThesisGuidanceEvaluationTable } from '@/components/thesis-guidance-evaluation/ThesisGuidanceEvaluationTable';
import { useRole } from '@/hooks/shared';

/**
 * Tugas Akhir > Evaluasi: the Ketua Departemen's decisions on
 * Evaluasi Bimbingan. Supervisors have no Evaluasi page: Pembimbing 1 fills a due evaluation
 * from Mahasiswa Bimbingan or the student detail, so they are sent there.
 */
export default function ThesisGuidanceEvaluationsPage() {
  const { isKadep } = useRole();
  if (!isKadep()) return <Navigate to="/tugas-akhir/bimbingan/lecturer/my-students" replace />;
  return <KadepThesisGuidanceEvaluations />;
}

function KadepThesisGuidanceEvaluations() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: 'Tugas Akhir' }, { label: 'Evaluasi' }], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle('Evaluasi Bimbingan');
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Evaluasi Bimbingan</h1>
        <p className="text-muted-foreground">Keputusan Ketua Departemen atas evaluasi masa bimbingan 6 bulan dan 1 tahun</p>
      </div>

      <ThesisGuidanceEvaluationTable />
    </div>
  );
}
