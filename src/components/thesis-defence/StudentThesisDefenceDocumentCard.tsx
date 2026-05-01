import { useRef, useCallback } from 'react';
import { FileText, Eye, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import {
  useDefenceDocumentTypes,
  useStudentDefenceDocuments,
  useUploadDefenceDocument,
} from '@/hooks/thesis-defence';
import type { DefenceDocument, DefenceDocumentType } from '@/types/defence.types';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StudentThesisDefenceDocumentCardProps {
  allChecklistMet: boolean;
  documents?: DefenceDocument[];
}

export function StudentThesisDefenceDocumentCard({
  allChecklistMet,
  documents: initialDocuments = [],
}: StudentThesisDefenceDocumentCardProps) {
  const isLocked = !allChecklistMet;

  const { data: docTypes } = useDefenceDocumentTypes();
  const { data: docsData } = useStudentDefenceDocuments();
  const uploadMutation = useUploadDefenceDocument();

  const documents = docsData?.documents ?? initialDocuments;

  const getDocStatus = useCallback(
    (docTypeId: string): DefenceDocument | undefined => {
      return documents.find((d) => d.documentTypeId === docTypeId);
    },
    [documents]
  );

  const showLockNotice = isLocked && (!documents || documents.length === 0);

  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px]">
      <div className="text-base font-semibold text-foreground mb-[14px]">
        Upload Dokumen Sidang
      </div>

      {showLockNotice && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 p-[8px_12px] bg-muted border border-gray-200 rounded-[7px]">
          <AlertCircle size={14} className="shrink-0 text-muted-foreground" />
          <span>Lengkapi checklist persyaratan untuk mengakses fitur upload.</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
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
    if (file) onUpload(file);
    e.target.value = '';
  };

  const handleUploadClick = () => {
    if (canUpload) fileInputRef.current?.click();
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

  const acceptStr = docType.accept
    .map((ext) => (ext.startsWith('.') ? ext : `.${ext}`))
    .join(',');

  const fileStatusColor = isApproved ? 'text-[#16A34A]' : isDeclined ? 'text-[#dc2626]' : 'text-muted-foreground';
  const fileStatusText = isApproved
    ? '✓ Terverifikasi'
    : isDeclined
      ? `Ditolak${doc?.notes ? `: ${doc.notes}` : ''}`
      : 'Menunggu verifikasi';

  return (
    <div
      className={cn(
        "flex items-center gap-[10px] p-[7px_10px] rounded-[7px] bg-card border border-gray-200 transition-all duration-200",
        isLocked && "opacity-[0.55]"
      )}
    >
      {/* File icon */}
      <div
        className={cn(
          "w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0",
          isApproved ? "bg-[#dcfce7] text-[#16A34A]" : 
          isDeclined ? "bg-[#fef2f2] text-[#dc2626]" : 
          isUploaded ? "bg-[#dbeafe] text-[#2563eb]" : 
          "bg-muted text-muted-foreground"
        )}
      >
        <FileText size={14} />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {docType.label}
        </div>
        {isUploaded && (
          <>
            <div className={cn("text-xs font-medium mt-0.5", fileStatusColor)}>
              {fileStatusText}
            </div>
            {doc?.fileName && (
              <div className="text-xs text-muted-foreground truncate">
                {doc.fileName}
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptStr}
          className="hidden"
          onChange={handleFileChange}
        />

        {isUploaded && doc?.filePath && (
          <button
            onClick={handleViewClick}
            title="Lihat dokumen"
            className="px-[9px] py-[4px] rounded-[5px] bg-transparent border border-gray-200 flex items-center gap-1 shrink-0 text-foreground hover:bg-accent transition-all duration-200 cursor-pointer text-xs font-semibold"
          >
            <Eye size={12} />
            <span>Lihat</span>
          </button>
        )}

        {isUploading ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Spinner className="h-3 w-3" />
            Upload...
          </div>
        ) : (
          <button
            disabled={!canUpload}
            onClick={handleUploadClick}
            className={cn(
              "shrink-0 px-[9px] py-[4px] text-xs font-semibold rounded-[5px] transition-all duration-200 cursor-pointer border",
              isDeclined 
                ? "border-destructive text-destructive bg-transparent hover:bg-destructive/10" 
                : canUpload 
                  ? "border-gray-200 text-foreground bg-transparent hover:bg-accent" 
                  : "border-gray-200 text-muted-foreground cursor-default"
            )}
          >
            {isUploaded ? (isDeclined ? 'Upload Ulang' : 'Ganti File') : 'Upload'}
          </button>
        )}
      </div>
    </div>
  );
}
