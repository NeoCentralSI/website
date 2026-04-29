import { useRef, useCallback } from 'react';
import { FileText, Eye, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import {
  useSeminarDocumentTypes,
  useStudentSeminarDocuments,
  useUploadSeminarDocument,
} from '@/hooks/thesis-seminar';
import type { SeminarDocument, SeminarDocumentType } from '@/types/seminar.types';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UploadDokumenSeminarProps {
  allChecklistMet: boolean;
  documents?: SeminarDocument[];
}

export function StudentThesisSeminarDocumentCard({
  allChecklistMet,
  documents: initialDocuments = [],
}: UploadDokumenSeminarProps) {
  const isLocked = !allChecklistMet;

  const { data: docTypes } = useSeminarDocumentTypes();
  const { data: docsData } = useStudentSeminarDocuments();
  const uploadMutation = useUploadSeminarDocument();

  const documents = docsData?.documents ?? initialDocuments;

  const getDocStatus = useCallback(
    (docTypeId: string): SeminarDocument | undefined => {
      return documents.find((d) => d.documentTypeId === docTypeId);
    },
    [documents]
  );

  const showLockNotice = isLocked && (!documents || documents.length === 0);

  return (
    <div className="bg-white border border-[#e8e8e4] rounded-[10px] p-[16px_18px]">
      <div className="text-[13px] font-bold text-[#111] mb-[14px]">
        Upload Dokumen Seminar
      </div>

      {showLockNotice && (
        <div className="flex items-center gap-2 text-[11.5px] text-[#888] mb-3 p-[8px_12px] bg-[#fafaf8] border border-[#e8e8e4] rounded-[7px]">
          <AlertCircle size={14} className="shrink-0 text-[#aaa]" />
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

  const fileStatusColor = isApproved ? 'text-[#16A34A]' : isDeclined ? 'text-[#dc2626]' : 'text-[#888]';
  const fileStatusText = isApproved
    ? '✓ Terverifikasi'
    : isDeclined
      ? `Ditolak${doc?.notes ? `: ${doc.notes}` : ''}`
      : 'Menunggu verifikasi';

  return (
    <div
      className={cn(
        "flex items-center gap-[10px] p-[7px_10px] rounded-[7px] bg-[#fafaf8] border border-[#eeece8] transition-all duration-200",
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
          "bg-[#f3f4f6] text-[#9ca3af]"
        )}
      >
        <FileText size={14} />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] font-medium text-[#111] truncate">
          {docType.label}
        </div>
        {isUploaded && (
          <>
            <div className={cn("text-[10px] font-medium mt-0.5", fileStatusColor)}>
              {fileStatusText}
            </div>
            {doc?.fileName && (
              <div className="text-[10px] text-[#aaa] truncate">
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
            className="px-[9px] py-[4px] rounded-[5px] bg-transparent border border-[#F59E0B] flex items-center gap-1 shrink-0 text-[#F59E0B] hover:bg-amber-50 transition-all duration-200 cursor-pointer text-[10.5px] font-semibold"
          >
            <Eye size={12} />
            <span>Lihat</span>
          </button>
        )}

        {isUploading ? (
          <div className="flex items-center gap-1 text-[10.5px] text-[#888]">
            <Spinner className="h-3 w-3" />
            Upload...
          </div>
        ) : (
          <button
            disabled={!canUpload}
            onClick={handleUploadClick}
            className={cn(
              "shrink-0 px-[9px] py-[4px] text-[10.5px] font-semibold rounded-[5px] transition-all duration-200 cursor-pointer border",
              isDeclined 
                ? "border-[#ef4444] text-[#ef4444] bg-transparent hover:bg-red-50" 
                : canUpload 
                  ? "border-[#F59E0B] text-[#F59E0B] bg-transparent hover:bg-amber-50" 
                  : "border-[#e8e8e4] text-[#bbb] cursor-default"
            )}
          >
            {isUploaded ? (isDeclined ? 'Upload Ulang' : 'Ganti File') : 'Upload'}
          </button>
        )}
      </div>
    </div>
  );
}
