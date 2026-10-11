import { useState } from 'react';
import { FilePenLine, Loader2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { useCancelChangeRequest, useThesisChangeContext } from '@/hooks/thesis-change-request/useThesisChangeRequest';
import { cn } from '@/lib/utils';
import type { ThesisChangeRequest } from '@/types/thesis-change-request.types';
import { ThesisChangeRequestFormDialog } from './ThesisChangeRequestFormDialog';
import {
  ThesisChangeRequestMeta,
  ThesisChangeRequestStatusBadge,
  ThesisChangeRequestSteps,
  ThesisChangeRequestSummary,
  ThesisChangeRequestTypeBadge,
} from './ThesisChangeRequestParts';

function RequestBlock({ request, children }: { request: ThesisChangeRequest; children?: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <ThesisChangeRequestTypeBadge request={request} />
        <ThesisChangeRequestStatusBadge status={request.status} />
      </div>
      <ThesisChangeRequestSummary request={request} />
      <ThesisChangeRequestSteps request={request} />
      <ThesisChangeRequestMeta request={request} />
      {children}
    </div>
  );
}

export interface ThesisChangeRequestCardProps {
  /** Omitted = the signed-in student's own thesis. */
  thesisId?: string;
  className?: string;
}

/**
 * "Perubahan Tugas Akhir": the "Ajukan Perubahan" button (disabled with its reason when a
 * request cannot be made), the running request with its steps, and the history.
 */
export function ThesisChangeRequestCard({ thesisId, className }: ThesisChangeRequestCardProps) {
  const { data: context, isLoading } = useThesisChangeContext(thesisId);
  const cancel = useCancelChangeRequest();
  const [formOpen, setFormOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  if (!context) return null;

  const open = context.openRequest;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Perubahan Tugas Akhir</CardTitle>
            <CardDescription>
              Pengajuan perubahan judul atau pembimbing, sampai sebelum pendaftaran seminar hasil.
            </CardDescription>
          </div>
          <Button disabled={!context.canSubmit} onClick={() => setFormOpen(true)}>
            <FilePenLine className="mr-2 h-4 w-4" />
            Ajukan Perubahan
          </Button>
        </div>
        {context.blockReason && (
          <p className="text-xs text-muted-foreground">Ajukan Perubahan belum tersedia: {context.blockReason}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {open ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Pengajuan berjalan</p>
            <RequestBlock request={open}>
              {open.viewer.canCancel && (
                <Button variant="outline" size="sm" disabled={cancel.isPending} onClick={() => setConfirmCancel(true)}>
                  Batalkan Pengajuan
                </Button>
              )}
            </RequestBlock>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Tidak ada pengajuan yang sedang berjalan.</p>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Riwayat</p>
          {context.history.length === 0 ? (
            <EmptyState size="sm" title="Belum Ada Riwayat" description="Pengajuan yang sudah ditutup akan tampil di sini." className="py-6" />
          ) : (
            <div className="space-y-3">
              {context.history.map((request) => <RequestBlock key={request.id} request={request} />)}
            </div>
          )}
        </div>
      </CardContent>

      <ThesisChangeRequestFormDialog open={formOpen} onOpenChange={setFormOpen} context={context} />

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan pengajuan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengajuan perubahan ini ditutup tanpa keputusan. Anda dapat mengajukan lagi setelahnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (open) cancel.mutate(open.id); }}
            >
              Batalkan Pengajuan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
