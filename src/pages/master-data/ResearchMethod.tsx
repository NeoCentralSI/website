import { useEffect, useMemo } from "react";
import { Navigate, useOutletContext, useParams } from "react-router-dom";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { ResearchMethodCpmkManagementPanel } from "@/components/master-data/research-method/ResearchMethodCpmkManagementPanel";
import { ResearchMethodRubricManagementPanel } from "@/components/master-data/research-method/ResearchMethodRubricManagementPanel";
import { TemplateManagementPanel } from "@/components/milestone/TemplateManagementPanel";
import { PageHeading } from "@/components/shared/PageHeading";
import { TabsNav } from "@/components/ui/tabs-nav";
import { useRole } from "@/hooks/shared/useRole";

/**
 * Kelola > Metode Penelitian (K18; Paket P8, 3): one address per tab, as Kelola Tugas Akhir.
 * Template Milestone (fase proposal, umum) is managed by the Sekretaris Departemen and the
 * Koordinator Metode Penelitian; CPMK and Rubrik Penilaian by the Sekretaris Departemen only, each
 * with its own period select inside the panel.
 */
const TABS = [
  { value: "milestone", label: "Template Milestone", to: "/kelola/metode-penelitian/milestone", sekdepOnly: false },
  { value: "cpmk", label: "CPMK", to: "/kelola/metode-penelitian/cpmk", sekdepOnly: true },
  { value: "rubrik", label: "Rubrik Penilaian", to: "/kelola/metode-penelitian/rubrik", sekdepOnly: true },
] as const;

export default function ResearchMethod() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { tab } = useParams();
  const { isSekdep } = useRole();
  const sekdep = isSekdep();
  const visible = useMemo(() => TABS.filter((t) => sekdep || !t.sekdepOnly), [sekdep]);
  const active = visible.find((t) => t.value === tab) ?? null;

  useEffect(() => {
    setBreadcrumbs([
      { label: "Kelola" },
      { label: "Metode Penelitian", href: "/kelola/metode-penelitian" },
      { label: active?.label ?? "Template Milestone" },
    ]);
    setTitle("Kelola Metode Penelitian");
  }, [active?.label, setBreadcrumbs, setTitle]);

  if (!active) return <Navigate to="/kelola/metode-penelitian/milestone" replace />;

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Kelola Metode Penelitian"
        subtitle={sekdep
          ? "Template milestone fase proposal, CPMK, serta kriteria dan rubrik Penilaian Proposal"
          : "Template milestone fase proposal yang dipasang mahasiswa"}
      />

      <TabsNav tabs={visible.map((t) => ({ label: t.label, to: t.to }))} />

      {active.value === "milestone" && <TemplateManagementPanel phase="proposal" />}
      {active.value === "cpmk" && <ResearchMethodCpmkManagementPanel />}
      {active.value === "rubrik" && <ResearchMethodRubricManagementPanel />}
    </div>
  );
}
