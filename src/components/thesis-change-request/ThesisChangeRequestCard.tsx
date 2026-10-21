import { useState } from 'react';
import { FilePenLine, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useThesisChangeContext } from '@/hooks/thesis-change-request/useThesisChangeRequest';
import { cn } from '@/lib/utils';
import type { ThesisChangeRequest } from '@/types/thesis-change-request.types';
import { ThesisChangeRequestFormDialog } from './ThesisChangeRequestFormDialog';
import {
  ThesisChangeRequestDetailDialog,
  ThesisChangeRequestMiniTable,
  ThesisChangeRequestStatusLine,
} from './ThesisChangeRequestViews';

export interface ThesisChangeRequestCardProps {
  thesisId: string;
  className?: string;
}

/**
 * Compact "Perubahan Tugas Akhir" on the lecturer's student detail: the current
 * state and "Ajukan Perubahan" (disabled with its reason), then a mini history table of this
 * student with Detail in a modal. A request waiting for the viewer's step is decided there.
 */
export function ThesisChangeRequestCard({ thesisId, className }: ThesisChangeRequestCardProps) {
  const { data: context, isLoading } = useThesisChangeContext(thesisId);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<ThesisChangeRequest | null>(null);

  if (isLoading) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  if (!context) return null;

  const open = context.openRequest;

  return (
    <Card className={cn('flex h-full w-full flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Perubahan Tugas Akhir</CardTitle>
            <CardDescription>Perubahan judul atau pembimbing, sampai sebelum pendaftaran seminar hasil.</CardDescription>
          </div>
          <span title={context.blockReason ?? undefined}>
            <Button size="sm" disabled={!context.canSubmit} onClick={() => setFormOpen(true)}>
              <FilePenLine className="mr-2 h-4 w-4" />
              Ajukan Perubahan
            </Button>
          </span>
        </div>
        {context.blockReason && (
          <p className="text-xs text-muted-foreground">Ajukan Perubahan belum tersedia: {context.blockReason}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {open ? (
          <ThesisChangeRequestStatusLine request={open} onDetail={() => setDetail(open)} />
        ) : (
          <p className="text-sm text-muted-foreground">Tidak ada pengajuan yang sedang berjalan.</p>
        )}
        <div className="space-y-2">
          <p className="text-sm font-medium">Riwayat</p>
          <ThesisChangeRequestMiniTable requests={context.history} onDetail={setDetail} />
        </div>
      </CardContent>

      <ThesisChangeRequestFormDialog open={formOpen} onOpenChange={setFormOpen} context={context} />
      <ThesisChangeRequestDetailDialog request={detail} onClose={() => setDetail(null)} />
    </Card>
  );
}
