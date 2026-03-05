import { useRef, useCallback } from 'react';
import { FileText, Upload, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  useDefenceDocumentTypes,
  useStudentDefenceDocuments,
  useUploadDefenceDocument,
} from '@/hooks/defence';
import type { DefenceDocument, DefenceDocumentType } from '@/types/defence.types';
import { API_CONFIG } from '@/config/api';

/** Map doc type name → accepted file extensions */
const DOC_TYPE_ACCEPT: Record<string, string[]> = {
  'Laporan Tugas Akhir': ['.pdf'],
  'Slide Presentasi': ['.ppt', '.pptx'],
  'Draft Jurnal TEKNOSI': ['.pdf'],
  'Sertifikat TOEFL': ['.pdf'],
  'Sertifikat SAPS': ['.pdf'],
};

/** Display label (with format hint) */
const DOC_TYPE_LABEL: Record<string, string> = {
  'Laporan Tugas Akhir': 'Laporan Tugas Akhir (PDF)',
  'Slide Presentasi': 'Slide Presentasi (PPT)',
  'Draft Jurnal TEKNOSI': 'Draft Jurnal TEKNOSI (PDF)',
  'Sertifikat TOEFL': 'Sertifikat TOEFL (PDF)',
  'Sertifikat SAPS': 'Sertifikat SAPS (PDF)',
};

interface UploadDokumenSidangProps {
  allChecklistMet: boolean;
}

export function UploadDokumenSidang({ allChecklistMet }: UploadDokumenSidangProps) {
  const isLocked = !allChecklistMet;

  const { data: docTypes } = useDefenceDocumentTypes();
  const { data: docsData } = useStudentDefenceDocuments();
  const uploadMutation = useUploadDefenceDocument();

  const documents = docsData?.documents ?? [];

  const getDocStatus = useCallback(
    (docTypeId: string): DefenceDocument | undefined => {
      return documents.find((d) => d.documentTypeId === docTypeId);
    },
    [documents]
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Dokumen Sidang</h3>

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
  docType: DefenceDocumentType;
  doc: DefenceDocument | undefined;
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
    e.target.value = '';
  };

  const handleUploadClick = () => {
    if (canUpload) {
      fileInputRef.current?.click();
    }
  };

  const handleViewClick = () => {
    if (doc?.filePath) {
      const url = `${API_CONFIG.BASE_URL.replace('/api', '')}/${doc.filePath}`;
      window.open(url, '_blank');
    }
  };

  const accept = DOC_TYPE_ACCEPT[docType.name] ?? ['.pdf'];
  const acceptStr = accept.join(',');
  const label = DOC_TYPE_LABEL[docType.name] ?? docType.name;

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
          <p className="text-sm font-medium truncate">{label}</p>
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
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptStr}
          className="hidden"
          onChange={handleFileChange}
        />

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
