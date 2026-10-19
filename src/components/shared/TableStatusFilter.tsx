import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TableStatusFilterProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  /** Accessible name of the control. */
  label?: string;
  className?: string;
}

/**
 * Filter status di toolbar tabel: "Menunggu / Sedang Berjalan / Riwayat"
 * menjadi pilihan di sini, bukan tab di dalam kartu.
 */
export function TableStatusFilter<T extends string>({ value, onChange, options, label = 'Filter status', className }: TableStatusFilterProps<T>) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as T)}>
      <SelectTrigger className={cn('h-9 w-44', className)} aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
