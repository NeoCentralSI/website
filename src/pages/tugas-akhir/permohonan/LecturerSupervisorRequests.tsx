import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';

import { Supervisor2RequestsSection } from '@/components/bimbingan/Supervisor2RequestsSection';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import {
  LecturerSupervisionLoadControls,
  LecturerSupervisorRequestTable,
} from '@/components/thesis-proposal/LecturerSupervisorRequestTable';

/**
 * Tugas Akhir > Permohonan (Paket E4, 4.1): Permohonan Pembimbing moves here from the
 * Mahasiswa tab of Bimbingan; the Pembimbing 2 requests of the proposal phase come along.
 */
export default function LecturerSupervisorRequestsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: 'Tugas Akhir' }, { label: 'Permohonan' }], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle('Permohonan Pembimbing');
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Permohonan Pembimbing</h1>
          <p className="text-muted-foreground">Mahasiswa yang mengajukan Anda sebagai pembimbing tugas akhir.</p>
        </div>
        <LecturerSupervisionLoadControls />
      </div>

      <LecturerSupervisorRequestTable />

      <Supervisor2RequestsSection />
    </div>
  );
}
