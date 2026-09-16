import { CalendarRange } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Ta03AcademicYearOption } from '@/hooks/shared/useTa03AcademicYearSelection';
import {
  formatOtherPeriodHint,
  type Ta03OtherPeriodHint,
} from '@/services/assessment.service';

export function Ta03AcademicYearPicker({
  years,
  value,
  onChange,
}: {
  years: Ta03AcademicYearOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (years.length === 0) return null;

  return (
    <div className="space-y-1">
      <Label htmlFor="ta03-academic-year" className="text-xs text-muted-foreground">
        Tahun ajaran
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="ta03-academic-year" className="w-[240px]" aria-label="Tahun ajaran">
          <SelectValue placeholder="Pilih tahun ajaran" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year.id} value={year.id}>
              {year.label}
              {year.isActive ? ' (Aktif)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function Ta03OtherPeriodHint({
  otherPeriods,
  onSelectPeriod,
}: {
  otherPeriods: Ta03OtherPeriodHint[] | undefined;
  onSelectPeriod: (academicYearId: string) => void;
}) {
  const description = formatOtherPeriodHint(otherPeriods);
  if (!description || !otherPeriods?.length) return null;

  return (
    <Alert>
      <CalendarRange className="h-4 w-4" />
      <AlertTitle>Mahasiswa di periode lain</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{description}</p>
        <div className="flex flex-wrap gap-2">
          {otherPeriods.map((period) => (
            <Button
              key={period.academicYearId}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelectPeriod(period.academicYearId)}
            >
              Buka {period.periodLabel}
            </Button>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
