import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Shared UI Atom: ThesisSeminarExaminersCell
 * Renders a numbered list of up to 2 examiners with overflow indicator.
 */

interface Examiner {
  id: string;
  lecturerName: string;
  order: number;
}

interface ThesisSeminarExaminersCellProps {
  examiners: Examiner[];
}

export function ThesisSeminarExaminersCell({ examiners }: ThesisSeminarExaminersCellProps) {
  if (!examiners || examiners.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="max-w-[280px] space-y-1 text-sm leading-snug">
      {examiners.slice(0, 2).map((e) => (
        <div key={e.id} className="truncate" title={`${e.order}. ${e.lecturerName}`}>
          {e.order}. {e.lecturerName}
        </div>
      ))}
      {examiners.length > 2 && (
        <div
          className="text-xs text-muted-foreground"
          title={examiners.slice(2).map((e) => `${e.order}. ${e.lecturerName}`).join(', ')}
        >
          +{examiners.length - 2} penguji lainnya
        </div>
      )}
    </div>
  );
}

/**
 * Shared UI Atom: ThesisSeminarAudienceCell
 * Renders an audience count badge.
 */

interface ThesisSeminarAudienceCellProps {
  count: number;
}

export function ThesisSeminarAudienceCell({ count }: ThesisSeminarAudienceCellProps) {
  if (!count || count === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Users className="h-3 w-3" />
      {count}
    </Badge>
  );
}
