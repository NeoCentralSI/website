import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import {
  LecturerApprovalInboxTable,
  LecturerSupervisionLoadControls,
} from '@/components/thesis-proposal/LecturerApprovalInboxTable';

/**
 * Tugas Akhir > Permohonan: the lecturer's approval inbox, the
 * Pengajuan Pembimbing, the lecturer's own steps of a Perubahan TA and the
 * Pembimbing 2 requests of the proposal phase, in one table.
 */
export default function LecturerSupervisorRequestsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: 'Tugas Akhir' }, { label: 'Permohonan' }], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle('Permohonan');
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold">Permohonan</h1>
          <p className="text-muted-foreground">Pengajuan pembimbing, Pembimbing 2, dan perubahan tugas akhir yang memerlukan persetujuan Anda</p>
        </div>
        <LecturerSupervisionLoadControls />
      </div>

      <LecturerApprovalInboxTable />
    </div>
  );
}
