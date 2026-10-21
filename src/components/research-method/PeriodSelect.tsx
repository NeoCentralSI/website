import { useQuery } from '@tanstack/react-query';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAcademicYearsAPI } from '@/services/admin.service';

interface PeriodSelectProps {
  value: string | null | undefined;
  onChange: (academicYearId: string) => void;
  className?: string;
}

/** Pilihan periode akademik (bawaan: periode berjalan yang dikirim halaman). */
export function PeriodSelect({ value, onChange, className }: PeriodSelectProps) {
  const { data } = useQuery({
    queryKey: ['academic-years', 'research-method'],
    queryFn: () => getAcademicYearsAPI({ page: 1, pageSize: 100 }),
    staleTime: 5 * 60_000,
  });
  return (
    <Select value={value ?? ''} onValueChange={onChange}>
      <SelectTrigger className={className ?? 'w-full md:w-60'} aria-label="Periode akademik">
        <SelectValue placeholder="Pilih periode" />
      </SelectTrigger>
      <SelectContent>
        {(data?.academicYears ?? []).map((year) => (
          <SelectItem key={year.id} value={year.id}>
            {year.semester === 'genap' ? 'Genap' : 'Ganjil'} {year.year}
            {year.isActive ? ' (Aktif)' : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
