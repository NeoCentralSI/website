import { useEffect, useMemo } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { ThesisChangeRequestTable } from '@/components/thesis-change-request/ThesisChangeRequestTable';
import { useRole } from '@/hooks/shared';

/**
 * Tugas Akhir > Perubahan: the Ketua Departemen's decisions on
 * Pengajuan Perubahan Tugas Akhir. Supervisors have no Perubahan page: they decide their own
 * steps in Permohonan and ask for a change from Mahasiswa Bimbingan, so they are sent there.
 */
export default function ThesisChangeRequestsPage() {
  const { isKadep } = useRole();
  if (!isKadep()) return <Navigate to="/tugas-akhir/permohonan" replace />;
  return <KadepThesisChangeRequests />;
}

function KadepThesisChangeRequests() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: 'Tugas Akhir' }, { label: 'Perubahan' }], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle('Perubahan Tugas Akhir');
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Perubahan Tugas Akhir</h1>
        <p className="text-muted-foreground">Keputusan Ketua Departemen atas pengajuan perubahan judul dan pembimbing</p>
      </div>

      <ThesisChangeRequestTable />
    </div>
  );
}
