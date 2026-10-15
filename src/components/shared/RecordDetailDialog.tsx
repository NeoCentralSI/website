import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RecordDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Approval actions may sit here as well as in the row (Paket E4, 0.2). */
  footer?: ReactNode;
}

/**
 * Modal "Detail" sebuah baris tabel (Paket E4, 0.2): semua atribut dan langkah persetujuan.
 * Isinya tidak pernah lebih lebar dari dialog; yang panjang digulir ke bawah.
 */
export function RecordDetailDialog({ open, onOpenChange, title, description, children, footer }: RecordDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-x-hidden overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="min-w-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="min-w-0 space-y-4">{children}</div>
        {footer && <DialogFooter className="flex-wrap gap-2">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
