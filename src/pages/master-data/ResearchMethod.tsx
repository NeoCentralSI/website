import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { ResearchMethodCpmkManagementPanel } from "@/components/master-data/research-method/ResearchMethodCpmkManagementPanel";
import { ResearchMethodMilestoneTemplatePanel } from "@/components/master-data/research-method/ResearchMethodMilestoneTemplatePanel";
import { useRole } from "@/hooks/shared/useRole";
import { ResearchMethodRubricManagementPanel } from "@/components/master-data/research-method/ResearchMethodRubricManagementPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocalTabsNav } from "@/components/ui/tabs-nav";
import {
  getAcademicYearsAPI,
  getActiveAcademicYearAPI,
} from "@/services/admin.service";

// K18: Template Milestone, CPMK, Rubrik Penilaian (Sekdep manages; the coordinator reads).
const TAB_ITEMS = [
  { label: "Template Milestone", value: "template" },
  { label: "CPMK", value: "cpmk" },
  { label: "Rubrik Penilaian", value: "rubric" },
];
type Tab = "template" | "cpmk" | "rubric";

export default function ResearchMethod() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isSekdep } = useRole();
  const [tab, setTab] = useState<Tab>("template");
  const [selectedYear, setSelectedYear] = useState<string>();

  const years = useQuery({
    queryKey: ["research-method-academic-years"],
    queryFn: () => getAcademicYearsAPI({ page: 1, pageSize: 100 }),
  });
  const active = useQuery({
    queryKey: ["research-method-active-academic-year"],
    queryFn: getActiveAcademicYearAPI,
  });

  const academicYearId = selectedYear || active.data?.academicYear?.id;
  const breadcrumbs = useMemo(
    () => [{ label: "Kelola" }, { label: "Metode Penelitian" }],
    [],
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle("Kelola Metode Penelitian");
  }, [breadcrumbs, setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelola Metode Penelitian</h1>
          <p className="text-muted-foreground">
            Kelola template milestone fase proposal, CPMK, serta kriteria dan
            rubrik penilaian proposal
          </p>
        </div>
        {/* The period applies to CPMK and rubrics; proposal templates are general. */}
        {tab !== "template" && <div className="w-full md:w-[260px]">
          <Select value={academicYearId || ""} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tahun ajaran" />
            </SelectTrigger>
            <SelectContent>
              {(years.data?.academicYears || []).map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.semester === "ganjil" ? "Ganjil" : "Genap"}{" "}
                  {item.year || ""}
                  {item.isActive ? " (Aktif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>}
      </div>

      <LocalTabsNav
        tabs={TAB_ITEMS}
        activeTab={tab}
        onTabChange={(value) => setTab(value as Tab)}
      />

      {tab === "template" ? (
        <ResearchMethodMilestoneTemplatePanel canEdit={isSekdep()} />
      ) : tab === "cpmk" ? (
        <ResearchMethodCpmkManagementPanel academicYearId={academicYearId} />
      ) : (
        <ResearchMethodRubricManagementPanel academicYearId={academicYearId} />
      )}
    </div>
  );
}
