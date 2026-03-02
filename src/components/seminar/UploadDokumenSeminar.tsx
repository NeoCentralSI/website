import { FileText, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SeminarDocument } from '@/types/seminar.types';

// Hardcoded seminar document types
const DOCUMENT_TYPES = [
  { id: 'laporan-ta', label: 'Laporan Tugas Akhir (PDF)', accept: '.pdf', maxSize: 5 },
  { id: 'slide-presentasi', label: 'Slide Presentasi (PPT)', accept: '.ppt,.pptx', maxSize: 10 },
  { id: 'draft-jurnal', label: 'Draft Jurnal TEKNOSI (PDF)', accept: '.pdf', maxSize: 5 },
] as const;

interface UploadDokumenSeminarProps {
  documents: SeminarDocument[];
  allChecklistMet: boolean;
  seminarId: string | null;
}

export function UploadDokumenSeminar({
  documents,
  allChecklistMet,
  seminarId,
}: UploadDokumenSeminarProps) {
  const isLocked = !allChecklistMet || !seminarId;

  const getDocStatus = (docTypeId: string) => {
    return documents.find((d) => d.documentTypeId === docTypeId);
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Dokumen Seminar</h3>

      {isLocked && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-3 bg-muted/30 rounded-md">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Lengkapi checklist persyaratan untuk mengakses fitur upload.</span>
        </div>
      )}

      <div className="space-y-3">
        {DOCUMENT_TYPES.map((docType) => {
          const doc = getDocStatus(docType.id);
          const isUploaded = !!doc;
          const isApproved = doc?.status === 'approved';
          const isDeclined = doc?.status === 'declined';

          return (
            <div
              key={docType.id}
              className={cn(
                'flex items-center justify-between gap-4 rounded-lg border p-4',
                isLocked && 'opacity-50'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    isApproved && 'bg-green-100 text-green-600',
                    isDeclined && 'bg-red-100 text-red-600',
                    isUploaded && !isApproved && !isDeclined && 'bg-blue-100 text-blue-600',
                    !isUploaded && 'bg-muted text-muted-foreground'
                  )}
                >
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{docType.label}</p>
                  {isUploaded && (
                    <p
                      className={cn(
                        'text-xs mt-0.5',
                        isApproved && 'text-green-600',
                        isDeclined && 'text-red-600',
                        !isApproved && !isDeclined && 'text-blue-600'
                      )}
                    >
                      {isApproved && 'Terverifikasi'}
                      {isDeclined && `Ditolak${doc?.notes ? `: ${doc.notes}` : ''}`}
                      {!isApproved && !isDeclined && 'Menunggu verifikasi'}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant={isDeclined ? 'destructive' : 'outline'}
                size="sm"
                disabled={isLocked || isApproved}
                className="shrink-0"
              >
                <Upload className="h-4 w-4 mr-1.5" />
                {isUploaded ? (isDeclined ? 'Upload Ulang' : 'Upload') : 'Upload'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
