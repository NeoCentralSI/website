import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import { useFilterOptions } from "./useMonitoring";

/** Value of `?semester=` (and of the select) that stands for every semester. */
export const ALL_SEMESTERS = "all";

/**
 * Semester filter of the monitoring page, kept in `?semester=`. Without the parameter the
 * semester that is running now is chosen; `all` stands for every semester.
 */
export function useMonitoringSemester() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: filterOptions, isPending } = useFilterOptions();

  const semesters = filterOptions?.academicYears ?? [];
  const requested = searchParams.get("semester");
  const current = semesters.find((semester) => semester.isActive);
  const fallback = current?.value ?? ALL_SEMESTERS;

  // A missing parameter cannot be resolved before the semesters are known; a semester the
  // list does not have (an old link) is treated as missing.
  let value: string | undefined;
  if (requested === ALL_SEMESTERS) value = ALL_SEMESTERS;
  else if (isPending) value = requested ?? undefined;
  else value = requested && semesters.some((semester) => semester.value === requested) ? requested : fallback;

  const selected = semesters.find((semester) => semester.value === value);

  const setSemester = useCallback(
    (next: string) => {
      setSearchParams((previous) => {
        const params = new URLSearchParams(previous);
        params.set("semester", next);
        return params;
      });
    },
    [setSearchParams],
  );

  return {
    semesters,
    /** Selected option; undefined while the default is still being resolved. */
    value,
    /** `academicYear` parameter of the monitoring endpoints; undefined for every semester. */
    academicYear: value === ALL_SEMESTERS ? undefined : value,
    isReady: value !== undefined,
    isAll: value === ALL_SEMESTERS,
    /** A single semester is chosen and it is not the one running now. */
    isPastOrOtherSemester: !!selected && !selected.isActive,
    label: value === ALL_SEMESTERS ? "Semua Semester" : selected?.label.trim() ?? "",
    setSemester,
  };
}
