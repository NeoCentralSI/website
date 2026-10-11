import { useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { KadepThesisChangeRequestPanel } from "@/components/thesis-change-request/KadepThesisChangeRequestPanel";

/**
 * Kelola > Perubahan Tugas Akhir (Ketua Departemen): the queue of Pengajuan Perubahan
 * Tugas Akhir and its history. Student handover ("Alihkan Mahasiswa") arrives here too.
 */
export default function KelolaTugasAkhirKadep() {
  const { setTitle, setBreadcrumbs } = useOutletContext<LayoutContext>();

  const breadcrumbs = useMemo(() => [{ label: "Kelola" }, { label: "Perubahan Tugas Akhir" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle("Perubahan Tugas Akhir");
  }, [breadcrumbs, setBreadcrumbs, setTitle]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perubahan Tugas Akhir</h1>
        <p className="text-muted-foreground">
          Putuskan pengajuan perubahan judul dan pembimbing, termasuk pengalihan mahasiswa antar dosen
        </p>
      </div>

      <KadepThesisChangeRequestPanel />
    </div>
  );
}
