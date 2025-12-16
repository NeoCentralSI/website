import { useQuery } from '@tanstack/react-query';
import { getActiveAcademicYearAPI } from '@/services/admin.service';

export function useActiveAcademicYear() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['activeAcademicYear'],
    queryFn: getActiveAcademicYearAPI,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const academicYear = data?.academicYear ?? null;

  const formatLabel = () => {
    if (!academicYear) return null;
    const semester = academicYear.semester === 'ganjil' ? 'Ganjil' : 'Genap';
    return `${semester} ${academicYear.year || ''}`.trim();
  };

  return {
    academicYear,
    label: formatLabel(),
    isLoading,
    error,
  };
}
