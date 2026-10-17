import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Lanjutan Paket E6: the footer of a detail modal in Perubahan, Evaluasi and Permohonan. The note
 * (e.g. "Langkah dosen belum selesai…") is one full line above the buttons, never beside them;
 * the buttons sit together at the right with the same gap: "Batal" (outline, closes), then the
 * actions in `children` (Tolak destructive, then Setujui). A read-only modal has only "Tutup".
 */
export function DetailDialogActions({ note, noteClassName, onClose, closeLabel, children }: {
  note?: ReactNode;
  noteClassName?: string;
  onClose: () => void;
  /** "Batal" next to actions, "Tutup" for a read-only modal (the default follows `children`). */
  closeLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-3">
      {note && <p className={cn('text-xs text-muted-foreground', noteClassName)}>{note}</p>}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onClose}>{closeLabel ?? (children ? 'Batal' : 'Tutup')}</Button>
        {children}
      </div>
    </div>
  );
}
