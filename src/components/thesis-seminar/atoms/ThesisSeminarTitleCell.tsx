import { toTitleCaseName } from '@/lib/text';

/**
 * Combined Shared UI Atom for Thesis Title + Student Name/NIM
 */
export function ThesisSeminarTitleCell({
  thesisTitle,
  studentName,
  studentNim,
}: {
  thesisTitle: string;
  studentName: string;
  studentNim: string;
}) {
  return (
    <div className="max-w-[400px]">
      <div className="text-sm font-semibold line-clamp-2 leading-tight mb-1" title={thesisTitle}>
        {thesisTitle || '-'}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{toTitleCaseName(studentName)}</span>
        <span>•</span>
        <span>{studentNim}</span>
      </div>
    </div>
  );
}

/**
 * Shared UI Atom for Supervisors list
 */
export function ThesisSeminarSupervisorsCell({ supervisors }: { supervisors: { name: string; role: string }[] }) {
  if (!supervisors || supervisors.length === 0) return <span className="text-muted-foreground">-</span>;
  return (
    <div className="max-w-[200px] space-y-0.5 text-xs">
      {supervisors.map((s, idx) => (
        <div key={idx} className="truncate" title={`${s.name} (${s.role})`}>
          {s.name} <span className="text-[10px] text-muted-foreground">({s.role === 'Pembimbing 1' ? 'P1' : 'P2'})</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Shared UI Atom for Student basic info (Name + NIM)
 */
export function ThesisSeminarStudentInfoCell({ name, nim }: { name: string; nim: string }) {
  return (
    <div className="max-w-[200px]">
      <div className="font-medium truncate" title={name}>{name || '-'}</div>
      <div className="text-xs text-muted-foreground">{nim || '-'}</div>
    </div>
  );
}

/**
 * Shared UI Atom for Thesis Title only
 */
export function ThesisSeminarThesisTitleCell({ title, maxWidth = 300 }: { title: string; maxWidth?: number }) {
  return (
    <div style={{ maxWidth }} className="text-sm line-clamp-2" title={title}>
      {title || '-'}
    </div>
  );
}
