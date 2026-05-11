import { toTitleCaseName } from '@/lib/text';

/**
 * Cell for Thesis Title only (Wraps text)
 */
export function ThesisTitleCell({ title, maxWidth = 300 }: { title: string; maxWidth?: number | string }) {
  return (
    <div 
      style={{ maxWidth }} 
      className="text-sm font-medium leading-relaxed whitespace-normal break-words py-1"
    >
      {title || '-'}
    </div>
  );
}

/**
 * Cell for Student Name + NIM (NIM in parentheses)
 */
export function ThesisStudentInfoCell({ name, nim }: { name: string; nim: string }) {
  return (
    <div className="max-w-[250px]">
      <div className="font-medium truncate" title={name}>{toTitleCaseName(name) || '-'}</div>
      <div className="text-xs text-muted-foreground">({nim || '-'})</div>
    </div>
  );
}

/**
 * Combined Cell: Title (Truncated) + Student Name (NIM)
 * Optimized for Archive table where title should not be too wide.
 */
export function ThesisEventTitleCell({
  title,
  studentName,
  studentNim,
}: {
  title: string;
  studentName: string;
  studentNim: string;
}) {
  return (
    <div className="py-0.5 max-w-[250px]">
      <div className="text-sm font-semibold truncate mb-0.5" title={title}>
        {title || '-'}
      </div>
      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <span className="truncate">{toTitleCaseName(studentName)}</span>
        <span className="shrink-0">({studentNim})</span>
      </div>
    </div>
  );
}

/**
 * Cell for Personnel (Supervisors/Examiners) in a numbered list
 */
export function ThesisPersonnelListCell({ 
  people 
}: { 
  people: { name: string; order?: number }[] 
}) {
  if (!people || people.length === 0) return <span className="text-muted-foreground text-sm">-</span>;

  // Ensure items are sorted by order or by role number (e.g., "Pembimbing 1")
  const sortedPeople = [...people].sort((a, b) => {
    const getOrder = (p: typeof a) => {
      if (p.order !== undefined) return p.order;
      const match = (p as any).role?.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };
    return getOrder(a) - getOrder(b);
  });

  return (
    <div className="space-y-1 text-sm leading-snug text-foreground">
      {sortedPeople.map((p, idx) => (
        <div key={idx} className="truncate" title={`${idx + 1}. ${toTitleCaseName(p.name)}`}>
          {idx + 1}. {toTitleCaseName(p.name)}
        </div>
      ))}
    </div>
  );
}



