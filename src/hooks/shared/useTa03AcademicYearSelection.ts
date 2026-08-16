import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { useActiveAcademicYear } from '@/hooks/shared/useActiveAcademicYear';
import { getAcademicYearsAPI } from '@/services/admin.service';

export type Ta03AcademicYearOption = {
  id: string;
  year: string | number;
  semester: 'ganjil' | 'genap';
  isActive: boolean;
  label: string;
};

function formatYearLabel(year: string | number | undefined, semester: string | undefined) {
  const semesterLabel = semester === 'ganjil' ? 'Ganjil' : 'Genap';
  return `${year ?? ''} ${semesterLabel}`.trim();
}

export function useTa03AcademicYearSelection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { academicYear: activeYear } = useActiveAcademicYear();
  const { data: yearsData, isLoading: isYearsLoading } = useQuery({
    queryKey: ['academic-years', { pageSize: 100 }],
    queryFn: () => getAcademicYearsAPI({ pageSize: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const years = useMemo<Ta03AcademicYearOption[]>(() => {
    const list = (yearsData?.academicYears ?? []).map((item) => ({
      id: item.id,
      year: item.year,
      semester: item.semester,
      isActive: item.isActive,
      label: formatYearLabel(item.year, item.semester),
    }));
    if (activeYear?.id && !list.some((item) => item.id === activeYear.id)) {
      list.unshift({
        id: activeYear.id,
        year: activeYear.year,
        semester: activeYear.semester,
        isActive: true,
        label: formatYearLabel(activeYear.year, activeYear.semester),
      });
    }
    return list;
  }, [activeYear, yearsData]);

  const urlAy = searchParams.get('ay');
  const selectedAyId = useMemo(() => {
    if (urlAy && (years.length === 0 || years.some((item) => item.id === urlAy))) {
      return urlAy;
    }
    return activeYear?.id ?? years.find((item) => item.isActive)?.id ?? years[0]?.id ?? '';
  }, [activeYear?.id, urlAy, years]);

  const setSelectedAyId = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('ay', id);
    else next.delete('ay');
    setSearchParams(next, { replace: true });
  };

  return {
    selectedAyId,
    setSelectedAyId,
    years,
    isYearsLoading,
    activeYearId: activeYear?.id ?? years.find((item) => item.isActive)?.id ?? '',
  };
}
