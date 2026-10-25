import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FileWarning, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FieldError, FieldLabel } from '@/components/shared/RequiredField';
import { fetchAuthenticatedBlob } from '@/lib/authenticatedFile';
import { formatDateTimeId } from '@/lib/text';

export type VerificationDocumentStatus = 'submitted' | 'approved' | 'declined' | null;

/** One requirement in the verification modal. */
export interface VerificationItem {
  id: string;
  name: string;
  status: VerificationDocumentStatus;
  fileName?: string | null;
  /** Protected API path of the file; empty when nothing is uploaded yet. */
  fileUrl?: string | null;
  submittedAt?: string | null;
  /** The note of an earlier rejection. */
  notes?: string | null;
}

export interface VerificationDecisionResult {
  /** The whole registration is verified: the modal closes. */
  done?: boolean;
}

interface DocumentVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Student name and NIM. */
  subtitle?: string | null;
  items: VerificationItem[];
  isLoading?: boolean;
  isPending?: boolean;
  onDecide: (item: VerificationItem, action: 'approve' | 'decline', notes?: string) => Promise<VerificationDecisionResult | void>;
}

const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'destructive' | 'warning' | 'secondary' }> = {
  approved: { label: 'Disetujui', variant: 'success' },
  declined: { label: 'Ditolak', variant: 'destructive' },
  submitted: { label: 'Menunggu', variant: 'warning' },
  none: { label: 'Belum diunggah', variant: 'secondary' },
};

export function formatFileSize(bytes?: number | null): string | null {
  if (!bytes && bytes !== 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** The file of the current requirement: blob URL for the preview and its size. */
function useRequirementFile(url: string | null | undefined, enabled: boolean) {
  const [state, setState] = useState<{ blobUrl: string | null; size: number | null; error: string | null }>({ blobUrl: null, size: null, error: null });

  useEffect(() => {
    if (!url || !enabled) return;
    let cancelled = false;
    let created: string | null = null;
    fetchAuthenticatedBlob(url)
      .then((blob) => {
        if (cancelled) return;
        created = URL.createObjectURL(blob);
        setState({ blobUrl: created, size: blob.size, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ blobUrl: null, size: null, error: error instanceof Error ? error.message : 'Gagal memuat dokumen.' });
      });
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
      setState({ blobUrl: null, size: null, error: null });
    };
  }, [url, enabled]);

  return state;
}

/**
 * Full-screen verification of registration documents (Seminar Hasil, Sidang, Yudisium):
 * the requirement, its status and file in the header with ‹ n/m › navigation, the PDF filling
 * the body, and Batal · Tolak · Setujui at the bottom. Setujui decides at once; Tolak asks for
 * the rejection note first.
 */
export function DocumentVerificationDialog({ open, onOpenChange, title, subtitle, items, isLoading, isPending, onDecide }: DocumentVerificationDialogProps) {
  const [index, setIndex] = useState(0);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineNotes, setDeclineNotes] = useState('');
  const [declineError, setDeclineError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const current = items[Math.min(index, Math.max(items.length - 1, 0))];
  const file = useRequirementFile(current?.fileUrl, open && !!current?.fileUrl);
  const canDecide = current?.status === 'submitted' && !isPending;
  const badge = STATUS_BADGE[current?.status ?? 'none'];
  const fileInfo = [current?.fileName, formatFileSize(file.size), current?.submittedAt ? `Diunggah ${formatDateTimeId(current.submittedAt)}` : null].filter(Boolean).join(' · ');

  const decide = async (action: 'approve' | 'decline', notes?: string) => {
    if (!current) return;
    let result: VerificationDecisionResult | void;
    try {
      result = await onDecide(current, action, notes);
    } catch {
      return; // the caller already told the user
    }
    if (action === 'decline') {
      setDeclineOpen(false);
      setDeclineNotes('');
    }
    if (result?.done) {
      onOpenChange(false);
      return;
    }
    // Go on with the next requirement still waiting.
    const next = items.findIndex((item, i) => i > index && item.status === 'submitted');
    if (next >= 0) setIndex(next);
  };

  const submitDecline = () => {
    if (!declineNotes.trim()) {
      setDeclineError('Catatan penolakan wajib diisi.');
      return;
    }
    void decide('decline', declineNotes.trim());
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[100vh] w-[100vw] max-w-[100vw] flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-[100vw]">
          <DialogHeader className="flex-shrink-0 space-y-2 border-b px-4 py-3 text-left sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
              <div className="min-w-0">
                <DialogTitle className="truncate">{title}</DialogTitle>
                <DialogDescription className="truncate">{subtitle || 'Periksa setiap dokumen persyaratan'}</DialogDescription>
              </div>
              {items.length > 0 && (
                <div className="flex items-center gap-1" aria-label="Navigasi persyaratan">
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="Persyaratan sebelumnya" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-12 text-center text-sm font-medium tabular-nums">{index + 1}/{items.length}</span>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="Persyaratan berikutnya" disabled={index >= items.length - 1} onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {current && (
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">{current.name}</span>
                <Badge variant={badge.variant}>{badge.label}</Badge>
                {fileInfo && <span className="min-w-0 truncate text-xs text-muted-foreground" title={fileInfo}>{fileInfo}</span>}
              </div>
            )}
            {current?.status === 'declined' && current.notes && (
              <p className="text-xs text-destructive">Catatan penolakan: {current.notes}</p>
            )}
          </DialogHeader>

          <div className="relative min-h-0 flex-1 bg-muted">
            {isLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat dokumen...
              </div>
            ) : !current ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Tidak ada dokumen untuk diverifikasi</div>
            ) : !current.fileUrl ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Dokumen belum diunggah oleh mahasiswa</div>
            ) : file.error ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground" role="alert">
                <FileWarning className="h-8 w-8" />
                {file.error}
              </div>
            ) : file.blobUrl ? (
              <iframe title={`Dokumen ${current.name}`} src={file.blobUrl} className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat dokumen...
              </div>
            )}
          </div>

          <div className="grid flex-shrink-0 grid-cols-3 gap-2 border-t px-4 py-3 sm:px-6">
            <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={!canDecide}
              onClick={() => {
                setDeclineNotes('');
                setDeclineError(null);
                setDeclineOpen(true);
              }}
            >
              Tolak
            </Button>
            <Button type="button" className="w-full" disabled={!canDecide} onClick={() => void decide('approve')}>
              {isPending && !declineOpen && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Setujui
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={declineOpen} onOpenChange={(value) => { if (!value) setDeclineOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Dokumen</DialogTitle>
            <DialogDescription>Catatan penolakan dikirim ke mahasiswa agar dokumennya diperbaiki</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <FieldLabel htmlFor="verification-decline-notes" required>Catatan penolakan</FieldLabel>
            <Textarea
              id="verification-decline-notes"
              rows={4}
              value={declineNotes}
              aria-invalid={Boolean(declineError)}
              onChange={(event) => {
                setDeclineNotes(event.target.value);
                if (event.target.value.trim()) setDeclineError(null);
              }}
            />
            <FieldError message={declineError} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeclineOpen(false)}>Batal</Button>
            <Button type="button" variant="destructive" disabled={isPending} onClick={submitDecline}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
