import { useRef } from 'react';
import { FileUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** File selector matching the archive import dialogs. */
export function ImportFilePicker({ file, onChange, disabled, label }: {
  file: File | null; onChange: (file: File | null) => void; disabled?: boolean; label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  return <div className="relative">
    <Input ref={input} type="file" accept=".xlsx,.xls,.csv" className="hidden" aria-label={label}
      disabled={disabled} onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
    <Button type="button" variant="outline" disabled={disabled} onClick={() => input.current?.click()}
      className="w-full justify-start gap-2 overflow-hidden pr-12 text-muted-foreground font-normal">
      <FileUp className="h-4 w-4 shrink-0" />
      <span className="truncate" title={file?.name}>{file?.name ?? 'Pilih file Excel atau CSV'}</span>
    </Button>
    {file && !disabled && <Button type="button" variant="ghost" size="icon" aria-label="Hapus file terpilih" title="Hapus file terpilih"
      className="absolute right-1 top-1/2 z-10 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:bg-muted hover:text-foreground"
      onClick={() => { onChange(null); if (input.current) input.current.value = ''; }}><X className="h-4 w-4" /></Button>}
  </div>;
}
