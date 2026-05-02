import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { useAdminThesisSeminarDetail, useValidateAdminThesisSeminarDocument } from '@/hooks/thesis-seminar/useAdminThesisSeminar';
import { toTitleCaseName, formatDateId } from '@/lib/text';
import { ExternalLink, CheckCircle, XCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminSeminarListItem, DocumentSubmitStatus } from '@/types/seminar.types';
import { openProtectedFile } from '@/lib/protected-file';
import { apiRequest } from '@/services/auth.service';
import { ENV } from '@/config/env';

interface AdminThesisSeminarValidationModalProps {
  seminar: AdminSeminarListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getDocStatusBadge(status: DocumentSubmitStatus) {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Disetujui</Badge>;
    case 'declined':
      return <Badge variant="destructive">Ditolak</Badge>;
    case 'submitted':
    default:
      return <Badge variant="warning">Menunggu</Badge>;
  }
}

export function AdminThesisSeminarValidationModal({ seminar, open, onOpenChange }: AdminThesisSeminarValidationModalProps) {
  const { data: detail, isLoading } = useAdminThesisSeminarDetail(
    open && seminar ? seminar.id : undefined
  );
  const validateMutation = useValidateAdminThesisSeminarDocument();

  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);

  // Build ordered document list (match docTypes order)
  const orderedDocs = detail
    ? detail.documentTypes.map((dt) => {
      const doc = detail.documents.find((d) => d.documentTypeId === dt.id);
      return { docType: dt, doc: doc || null };
    })
    : [];

  const currentEntry = orderedDocs[activeDocIndex];
  const currentDoc = currentEntry?.doc || null;
  const currentDocType = currentEntry?.docType || null;

  // Reset state when seminar changes
  useEffect(() => {
    if (open) {
      setActiveDocIndex(0);
      setNotes('');
    }
  }, [open, seminar?.id]);

  // Update notes when switching docs
  useEffect(() => {
    setNotes('');
  }, [activeDocIndex]);

  // Fetch and create blob URL for PDF preview
  useEffect(() => {
    if (!currentDoc?.filePath) {
      setBlobUrl(null);
      return;
    }

    let active = true;
    setIsFileLoading(true);

    const fetchFile = async () => {
      try {
        const normalized = currentDoc.filePath!.replace(/^\/+/, '');
        const fileUrl = `${ENV.API_BASE_URL}/${normalized}`;

        const res = await apiRequest(fileUrl, { method: 'GET' });
        if (!res.ok) throw new Error();

        const blob = await res.blob();
        if (active) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch {
        if (active) toast.error('Gagal memuat preview dokumen');
      } finally {
        if (active) setIsFileLoading(false);
      }
    };

    fetchFile();

    return () => {
      active = false;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [currentDoc?.filePath]);

  const handleValidate = useCallback(
    (action: 'approve' | 'decline') => {
      if (!seminar || !currentDoc || !currentDocType) return;

      validateMutation.mutate(
        {
          seminarId: seminar.id,
          documentTypeId: currentDocType.id,
          payload: { action, notes: notes.trim() || undefined },
        },
        {
          onSuccess: (result) => {
            const msg = action === 'approve' ? 'Dokumen disetujui' : 'Dokumen ditolak';
            toast.success(msg);

            if (result.seminarTransitioned) {
              toast.success('Semua dokumen disetujui — seminar berstatus "Terverifikasi"');
              onOpenChange(false);
            } else {
              // Auto-advance to next unverified document
              const nextIdx = orderedDocs.findIndex(
                (entry, i) => i > activeDocIndex && entry.doc?.status === 'submitted'
              );
              if (nextIdx >= 0) {
                setActiveDocIndex(nextIdx);
              }
            }
            setNotes('');
          },
          onError: (err) => {
            toast.error(err.message || 'Gagal memvalidasi dokumen');
          },
        }
      );
    },
    [seminar, currentDoc, currentDocType, notes, validateMutation, onOpenChange, orderedDocs, activeDocIndex]
  );

  const canValidate = currentDoc?.status === 'submitted';
  const canDownload = !!currentDoc?.filePath;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validasi Dokumen Seminar Hasil</DialogTitle>
          {detail && (
            <div className="text-sm text-muted-foreground mt-1">
              {toTitleCaseName(detail.student.name)} — {detail.student.nim}
            </div>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : detail && orderedDocs.length > 0 ? (
          <div className="space-y-4">
            {/* Document navigator */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                disabled={activeDocIndex === 0}
                onClick={() => setActiveDocIndex((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
              </Button>
              <span className="text-sm font-medium">
                Dokumen {activeDocIndex + 1} / {orderedDocs.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={activeDocIndex === orderedDocs.length - 1}
                onClick={() => setActiveDocIndex((i) => Math.min(orderedDocs.length - 1, i + 1))}
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Documents overview pills */}
            <div className="flex gap-2 flex-wrap justify-center">
              {orderedDocs.map((entry, idx) => (
                <button
                  key={entry.docType.id}
                  onClick={() => setActiveDocIndex(idx)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${idx === activeDocIndex
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                    }`}
                >
                  {entry.docType.name}
                  {entry.doc && (
                    <span className="ml-1.5">
                      {entry.doc.status === 'approved' && '✓'}
                      {entry.doc.status === 'declined' && '✗'}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Current document detail */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{currentDocType?.name}</h4>
                {currentDoc && getDocStatusBadge(currentDoc.status)}
              </div>

              {currentDoc ? (
                <>
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{currentDoc.fileName || 'File'}</span>
                    {canDownload && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await openProtectedFile(currentDoc!.filePath!, currentDoc?.fileName || undefined);
                          } catch (error) {
                            toast.error((error as Error).message || 'Gagal membuka dokumen');
                          }
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Buka di Tab Baru
                      </Button>
                    )}
                  </div>

                  {/* PDF preview */}
                  <div className="rounded border bg-muted overflow-hidden" style={{ height: '480px' }}>
                    {isFileLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Spinner className="h-6 w-6" />
                      </div>
                    ) : blobUrl ? (
                      <iframe
                        src={blobUrl}
                        title="Preview Dokumen"
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        Preview tidak tersedia
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Diunggah: {formatDateId(currentDoc.submittedAt)}</div>
                    {currentDoc.verifiedAt && (
                      <div>
                        Diverifikasi: {formatDateId(currentDoc.verifiedAt)} oleh{' '}
                        {toTitleCaseName(currentDoc.verifiedBy)}
                      </div>
                    )}
                    {currentDoc.notes && (
                      <div className="mt-1 p-2 bg-muted rounded text-xs">
                        <span className="font-medium">Catatan:</span> {currentDoc.notes}
                      </div>
                    )}
                  </div>

                  {/* Validation controls - only for 'submitted' status */}
                  {canValidate && (
                    <div className="space-y-3 border-t pt-3">
                      <Textarea
                        placeholder="Catatan (opsional)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleValidate('decline')}
                          disabled={validateMutation.isPending}
                        >
                          {validateMutation.isPending ? (
                            <>
                              <Spinner className="mr-2 h-4 w-4" />
                              Memproses...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Tolak
                            </>
                          )}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleValidate('approve')}
                          disabled={validateMutation.isPending}
                        >
                          {validateMutation.isPending ? (
                            <>
                              <Spinner className="mr-2 h-4 w-4" />
                              Memproses...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Setujui
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Dokumen belum diunggah oleh mahasiswa.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Tidak ada dokumen untuk divalidasi.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
