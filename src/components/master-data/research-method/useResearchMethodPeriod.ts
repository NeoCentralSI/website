import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getAcademicYearsAPI, getActiveAcademicYearAPI } from "@/services/admin.service";

type YearOption = { id: string; semester?: string; year?: string | number | null; isActive?: boolean };

/** "Ganjil 2026/2027 (Aktif)", as on the thesis CPMK and rubric panels. */
export function academicYearOptionLabel(year: YearOption): string {
  return `${year.semester === "ganjil" ? "Ganjil" : "Genap"} ${year.year ?? ""}`.trim() + (year.isActive ? " (Aktif)" : "");
}

/**
 * The period of one panel of Kelola > Metode Penelitian (CPMK or Rubrik), chosen
 * inside the panel as on the thesis master data; the active period by default.
 */
export function useResearchMethodPeriod() {
  const [selected, setSelected] = useState<string>();
  const years = useQuery({
    queryKey: ["research-method-academic-years"],
    queryFn: () => getAcademicYearsAPI({ page: 1, pageSize: 100 }),
  });
  const active = useQuery({
    queryKey: ["research-method-active-academic-year"],
    queryFn: getActiveAcademicYearAPI,
  });
  return {
    academicYearId: selected || active.data?.academicYear?.id,
    setAcademicYearId: setSelected,
    years: (years.data?.academicYears ?? []) as YearOption[],
    isLoading: years.isLoading || active.isLoading,
  };
}
