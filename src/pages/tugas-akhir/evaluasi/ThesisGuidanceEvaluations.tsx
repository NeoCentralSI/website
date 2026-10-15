import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { ThesisGuidanceEvaluationTable } from '@/components/thesis-guidance-evaluation/ThesisGuidanceEvaluationTable';
import { useRole } from '@/hooks/shared';

/**
 * Tugas Akhir > Evaluasi (Paket E4, 4.3): Evaluasi Bimbingan for supervisors (what is due,
 * "Isi Evaluasi") and the Ketua Departemen (Setujui / Tolak), on one page.
 */
export default function ThesisGuidanceEvaluationsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isKadep } = useRole();
  const breadcrumb = useMemo(() => [{ label: 'Tugas Akhir' }, { label: 'Evaluasi' }], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle('Evaluasi Bimbingan');
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Evaluasi Bimbingan</h1>
        <p className="text-muted-foreground">Evaluasi masa bimbingan 6 bulan dan 1 tahun beserta keputusan Ketua Departemen.</p>
      </div>

      <ThesisGuidanceEvaluationTable isKadep={isKadep()} />
    </div>
  );
}
