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
import { useAdminYudisiumParticipantDetail, useValidateYudisiumDocument } from '@/hooks/yudisium/useAdminYudisium';
import { formatDateId, toTitleCaseName } from '@/lib/text';
import { apiRequest } from '@/services/auth.service';
import { ENV } from '@/config/env';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminYudisiumParticipant, AdminYudisiumParticipantDocument } from '@/types/adminYudisium.types';

interface YudisiumValidationModalProps {
  participant: AdminYudisiumParticipant | null;
  yudisiumId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getDocStatusBadge(status: AdminYudisiumParticipantDocument['status']) {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Disetujui</Badge>;
    case 'declined':
      return <Badge variant="destructive">Ditolak</Badge>;
    case 'submitted':
      return <Badge variant="warning">Menunggu</Badge>;
    default:
      return <Badge variant="secondary">Belum Upload</Badge>;
  }
}

export function YudisiumValidationModal({
  participant,
  yudisiumId,
  open,
  onOpenChange,
}: YudisiumValidationModalProps) {
  const { data: detail, isLoading } = useAdminYudisiumParticipantDetail(
    open && participant ? participant.id : ''
  );
  const validateMutation = useValidateYudisiumDocument(yudisiumId);

  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const documents = detail?.documents ?? [];
  const currentDoc = documents[activeDocIndex];

  useEffect(() => {
    if (open) {
      setActiveDocIndex(0);
      setNotes('');
      setPdfBlobUrl(null);
    }
  }, [open, participant?.id]);

  useEffect(() => {
    setNotes('');
    // Revoke previous blob URL
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    // Load PDF for current doc
    const filePath = currentDoc?.document?.filePath;
    if (!filePath) return;

    let cancelled = false;
    setPdfLoading(true);

    const normalized = filePath.replace(/^\/+/, '');
    const fileUrl = `${ENV.API_BASE_URL}/${normalized}`;

    apiRequest(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load PDF');
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPdfBlobUrl(null);
      })
      .finally(() => {
        if (!cancelled) setPdfLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDocIndex, currentDoc?.document?.filePath]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidate = useCallback(
    (action: 'approve' | 'decline') => {
      if (!participant || !currentDoc?.document) return;

      validateMutation.mutate(
        {
          participantId: participant.id,
          requirementId: currentDoc.requirementId,
          payload: { action, notes: notes.trim() || undefined },
        },
        {
          onSuccess: (result) => {
            if (result.participantTransitioned) {
              toast.success('Semua dokumen disetujui — peserta berstatus "Menunggu Validasi CPL"');
              onOpenChange(false);
            } else {
              // Auto-advance to next submitted doc
              const nextIdx = documents.findIndex(
                (entry, i) => i > activeDocIndex && entry.status === 'submitted'
              );
              if (nextIdx >= 0) {
                setActiveDocIndex(nextIdx);
              }
            }
            setNotes('');
          },
        }
      );
    },
    [participant, currentDoc, notes, validateMutation, onOpenChange, documents, activeDocIndex]
  );

  const canValidate = currentDoc?.status === 'submitted';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validasi Dokumen Yudisium</DialogTitle>
          {detail && (
            <div className="text-sm text-muted-foreground mt-1">
              {toTitleCaseName(detail.studentName)} — {detail.studentNim}
            </div>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : detail && documents.length > 0 ? (
          <div className="space-y-4">
            {/* Navigation */}
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
                Dokumen {activeDocIndex + 1} / {documents.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={activeDocIndex === documents.length - 1}
                onClick={() => setActiveDocIndex((i) => Math.min(documents.length - 1, i + 1))}
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Doc tabs */}
            <div className="flex gap-2 flex-wrap">
              {documents.map((entry, idx) => (
                <button
                  key={entry.requirementId}
                  onClick={() => setActiveDocIndex(idx)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    idx === activeDocIndex
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                  }`}
                >
                  {entry.requirementName}
                  {entry.status && (
                    <span className="ml-1.5">
                      {entry.status === 'approved' && '✓'}
                      {entry.status === 'declined' && '✗'}
                      {entry.status === 'submitted' && '•'}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Current document detail */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{currentDoc?.requirementName}</h4>
                {currentDoc && getDocStatusBadge(currentDoc.status)}
              </div>

              {currentDoc?.document ? (
                <>
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{currentDoc.document.fileName || 'File'}</span>
                    {currentDoc.document.filePath && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (pdfBlobUrl) {
                            window.open(pdfBlobUrl, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        disabled={!pdfBlobUrl}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Buka Tab Baru
                      </Button>
                    )}
                  </div>

                  {/* Embedded PDF viewer */}
                  <div className="border rounded-lg overflow-hidden bg-muted/30">
                    {pdfLoading ? (
                      <div className="flex items-center justify-center h-[400px]">
                        <Spinner className="h-6 w-6" />
                      </div>
                    ) : pdfBlobUrl ? (
                      <iframe
                        src={pdfBlobUrl}
                        className="w-full h-[400px]"
                        title={currentDoc.document.fileName || 'Dokumen'}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-[400px] text-sm text-muted-foreground">
                        Gagal memuat pratinjau dokumen
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    {currentDoc.submittedAt && (
                      <div>Diunggah: {formatDateId(currentDoc.submittedAt)}</div>
                    )}
                    {currentDoc.verifiedAt && (
                      <div>
                        Diverifikasi: {formatDateId(currentDoc.verifiedAt)} oleh{' '}
                        {toTitleCaseName(currentDoc.verifiedBy || '-')}
                      </div>
                    )}
                    {currentDoc.notes && (
                      <div className="mt-1 p-2 bg-muted rounded text-xs">
                        <span className="font-medium">Catatan:</span> {currentDoc.notes}
                      </div>
                    )}
                  </div>

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
