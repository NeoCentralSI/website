import { useEffect } from "react";
import { Navigate, useOutletContext, useParams } from "react-router-dom";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { ResearchMethodCpmkManagementPanel } from "@/components/master-data/research-method/ResearchMethodCpmkManagementPanel";
import { ResearchMethodRubricManagementPanel } from "@/components/master-data/research-method/ResearchMethodRubricManagementPanel";
import { TemplateManagementPanel } from "@/components/milestone/TemplateManagementPanel";
import { PageHeading } from "@/components/shared/PageHeading";
import { TabsNav } from "@/components/ui/tabs-nav";

/**
 * Kelola > Metode Penelitian: one address per tab, as Kelola Tugas Akhir.
 * The page and its master data are the Sekretaris Departemen's
 * only (route guard in App.tsx): Template Milestone (fase proposal, umum), CPMK and Rubrik
 * Penilaian, the last two with their own period select inside the panel.
 */
const TABS = [
  { value: "milestone", label: "Template Milestone", to: "/kelola/metode-penelitian/milestone" },
  { value: "cpmk", label: "CPMK", to: "/kelola/metode-penelitian/cpmk" },
  { value: "rubrik", label: "Rubrik Penilaian", to: "/kelola/metode-penelitian/rubrik" },
] as const;

export default function ResearchMethod() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { tab } = useParams();
  const active = TABS.find((t) => t.value === tab) ?? null;

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
        subtitle="Template milestone fase proposal, CPMK, serta kriteria dan rubrik Penilaian Proposal"
      />

      <TabsNav tabs={TABS.map((t) => ({ label: t.label, to: t.to }))} />

      {active.value === "milestone" && <TemplateManagementPanel phase="proposal" />}
      {active.value === "cpmk" && <ResearchMethodCpmkManagementPanel />}
      {active.value === "rubrik" && <ResearchMethodRubricManagementPanel />}
    </div>
  );
}
