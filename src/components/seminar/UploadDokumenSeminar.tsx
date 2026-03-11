import { useRef, useCallback } from 'react';
import { FileText, Upload, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  useSeminarDocumentTypes,
  useStudentSeminarDocuments,
  useUploadSeminarDocument,
} from '@/hooks/seminar';
import type { SeminarDocument, SeminarDocumentType } from '@/types/seminar.types';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';

interface UploadDokumenSeminarProps {
  allChecklistMet: boolean;
}

export function UploadDokumenSeminar({
  allChecklistMet,
}: UploadDokumenSeminarProps) {
  const isLocked = !allChecklistMet;

  const { data: docTypes } = useSeminarDocumentTypes();
  const { data: docsData } = useStudentSeminarDocuments();
  const uploadMutation = useUploadSeminarDocument();

  const documents = docsData?.documents ?? [];

  const getDocStatus = useCallback(
    (docTypeId: string): SeminarDocument | undefined => {
      return documents.find((d) => d.documentTypeId === docTypeId);
    },
    [documents]
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Dokumen Seminar</h3>

      {isLocked && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-3 bg-muted/30 rounded-md">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Lengkapi checklist persyaratan untuk mengakses fitur upload.</span>
        </div>
      )}

      <div className="space-y-3">
        {(docTypes ?? []).map((docType) => (
          <DocumentRow
            key={docType.id}
            docType={docType}
            doc={getDocStatus(docType.id)}
            isLocked={isLocked}
            isUploading={
              uploadMutation.isPending &&
              uploadMutation.variables?.documentTypeName === docType.name
            }
            onUpload={(file) =>
              uploadMutation.mutate({ file, documentTypeName: docType.name })
            }
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Sub-component: DocumentRow
// ============================================================

interface DocumentRowProps {
  docType: SeminarDocumentType;
  doc: SeminarDocument | undefined;
  isLocked: boolean;
  isUploading: boolean;
  onUpload: (file: File) => void;
}

function DocumentRow({ docType, doc, isLocked, isUploading, onUpload }: DocumentRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploaded = !!doc;
  const isApproved = doc?.status === 'approved';
  const isDeclined = doc?.status === 'declined';
  const canUpload = !isLocked && !isApproved && !isUploading;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleUploadClick = () => {
    if (canUpload) {
      fileInputRef.current?.click();
    }
  };

  const handleViewClick = async () => {
    if (doc?.filePath) {
      try {
        await openProtectedFile(doc.filePath, doc.fileName || undefined);
      } catch (error) {
        toast.error((error as Error).message || 'Gagal membuka dokumen');
      }
    }
  };

  // Build accept string from docType.accept array
  const acceptStr = docType.accept
    .map((ext) => (ext.startsWith('.') ? ext : `.${ext}`))
    .join(',');

  return (
    <div
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
            <>
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
              {doc?.fileName && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {doc.fileName}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptStr}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* View button (when document exists) */}
        {isUploaded && doc?.filePath && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewClick}
            title="Lihat dokumen"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}

        {/* Upload / Re-upload button */}
        <Button
          variant={isDeclined ? 'destructive' : 'outline'}
          size="sm"
          disabled={!canUpload}
          onClick={handleUploadClick}
        >
          {isUploading ? (
            <>
              <Spinner className="mr-1.5 h-4 w-4" />
              Mengupload...
            </>
          ) : (
            <>
              {isUploaded && !isApproved ? (
                <RefreshCw className="h-4 w-4 mr-1.5" />
              ) : (
                <Upload className="h-4 w-4 mr-1.5" />
              )}
              {isUploaded ? (isDeclined ? 'Upload Ulang' : 'Ganti File') : 'Upload'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
