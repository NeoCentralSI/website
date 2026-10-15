import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowRightLeft } from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { LecturerTransferStudentsDialog } from '@/components/thesis-change-request/LecturerTransferStudentsDialog';
import { ThesisChangeRequestTable } from '@/components/thesis-change-request/ThesisChangeRequestTable';
import { Button } from '@/components/ui/button';
import { useAuth, useRole } from '@/hooks/shared';

/**
 * Tugas Akhir > Perubahan (Paket E4, 4.2): Pengajuan Perubahan Tugas Akhir for supervisors and
 * the Ketua Departemen on one page, the content by role. "Alihkan Mahasiswa" sits in the header.
 * Replaces the change part of the Kadep's "Persetujuan Tugas Akhir" page (4.4).
 */
export default function ThesisChangeRequestsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { user } = useAuth();
  const { isPembimbing, isKadep } = useRole();
  const isSupervisor = isPembimbing();
  const isHead = isKadep();
  const [transferOpen, setTransferOpen] = useState(false);
  const breadcrumb = useMemo(() => [{ label: 'Tugas Akhir' }, { label: 'Perubahan' }], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle('Perubahan Tugas Akhir');
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Perubahan Tugas Akhir</h1>
          <p className="text-muted-foreground">
            Pengajuan perubahan judul atau pembimbing yang melibatkan Anda{isHead ? ' dan yang menunggu keputusan Ketua Departemen' : ''}.
          </p>
        </div>
        {isSupervisor && (
          <Button variant="outline" className="gap-1.5" onClick={() => setTransferOpen(true)}>
            <ArrowRightLeft className="h-4 w-4" />
            Alihkan Mahasiswa
          </Button>
        )}
      </div>

      <ThesisChangeRequestTable isKadep={isHead} />

      {isSupervisor && (
        <LecturerTransferStudentsDialog open={transferOpen} onOpenChange={setTransferOpen} currentLecturerId={user?.id} />
      )}
    </div>
  );
}
