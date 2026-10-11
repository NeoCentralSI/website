import { useEffect, useMemo } from "react";
import { useLocation, useOutletContext } from "react-router-dom";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav } from "@/components/ui/tabs-nav";
import { KadepThesisChangeRequestPanel } from "@/components/thesis-change-request/KadepThesisChangeRequestPanel";
import { KadepThesisGuidanceEvaluationPanel } from "@/components/thesis-guidance-evaluation/KadepThesisGuidanceEvaluationPanel";

const TABS = [
  {
    label: "Perubahan Tugas Akhir",
    to: "/kelola/tugas-akhir/kadep/perubahan",
    description: "Putuskan pengajuan perubahan judul dan pembimbing, termasuk pengalihan mahasiswa antar dosen",
    Panel: KadepThesisChangeRequestPanel,
  },
  {
    label: "Evaluasi Bimbingan",
    to: "/kelola/tugas-akhir/kadep/evaluasi",
    description: "Putuskan rekomendasi pembimbing dari evaluasi bimbingan 6 bulan dan 1 tahun",
    Panel: KadepThesisGuidanceEvaluationPanel,
  },
] as const;

/**
 * Kelola > Persetujuan Tugas Akhir (Ketua Departemen): what waits for the department's
 * decision during the research phase — thesis change requests and guidance evaluations.
 */
export default function KelolaTugasAkhirKadep() {
  const { pathname } = useLocation();
  const { setTitle, setBreadcrumbs } = useOutletContext<LayoutContext>();

  const activeTab = TABS.find((tab) => pathname.startsWith(tab.to)) ?? TABS[0];
  const breadcrumbs = useMemo(
    () => [{ label: "Kelola" }, { label: "Persetujuan Tugas Akhir", href: TABS[0].to }, { label: activeTab.label }],
    [activeTab.label],
  );
  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle("Persetujuan Tugas Akhir");
  }, [breadcrumbs, setBreadcrumbs, setTitle]);

  const Panel = activeTab.Panel;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Persetujuan Tugas Akhir</h1>
        <p className="text-muted-foreground">{activeTab.description}</p>
      </div>

      <div>
        <TabsNav tabs={TABS.map(({ label, to }) => ({ label, to }))} />
        <Panel />
      </div>
    </div>
  );
}
