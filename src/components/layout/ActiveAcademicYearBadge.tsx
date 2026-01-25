import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useActiveAcademicYear } from '@/hooks/shared';

export function ActiveAcademicYearBadge() {
  const { label, isLoading } = useActiveAcademicYear();

  if (isLoading) {
    return <Spinner className="size-4" />;
  }

  if (!label) {
    return null;
  }

  return (
    <Badge variant="outline" className="gap-1.5 text-xs font-medium">
      <Calendar className="h-3 w-3" />
      <span>{label}</span>
    </Badge>
  );
}
