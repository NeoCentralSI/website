import { useQuery } from '@tanstack/react-query';
import { getStudentYudisiumOverview } from '@/services/studentYudisium.service';

const studentYudisiumKeys = {
  all: ['student-yudisium'] as const,
  overview: () => [...studentYudisiumKeys.all, 'overview'] as const,
};

export function useStudentYudisiumOverview() {
  return useQuery({
    queryKey: studentYudisiumKeys.overview(),
    queryFn: getStudentYudisiumOverview,
  });
}
