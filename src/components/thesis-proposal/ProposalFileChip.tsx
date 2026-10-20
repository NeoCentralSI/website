import { useState } from 'react';
import { FileText } from 'lucide-react';

import AuthenticatedDocumentPreviewDialog from '@/components/thesis/AuthenticatedDocumentPreviewDialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * A proposal file (final or revision) as a chip: the name is cut with an ellipsis and the full
 * name is in the tooltip. A click opens the full-screen document viewer of the guidance files,
 * which also offers "Buka di tab baru".
 */
export function ProposalFileChip({ url, fileName, className }: { url: string | null | undefined; fileName: string | null | undefined; className?: string }) {
  const [open, setOpen] = useState(false);
  if (!url) return <span className="text-muted-foreground">-</span>;
  const name = fileName || 'Proposal.pdf';
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn('h-7 max-w-full gap-1.5 px-2 font-normal', className)}
        title={name}
        aria-label={`Lihat ${name}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="min-w-0 truncate text-xs">{name}</span>
      </Button>
      <AuthenticatedDocumentPreviewDialog open={open} onOpenChange={setOpen} fileName={name} filePath={url} />
    </>
  );
}
