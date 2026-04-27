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

  return (
    <div style={{ background: '#fff', border: '1px solid #e8e8e4', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 14 }}>
        Upload Dokumen Seminar
      </div>

      {isLocked && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11.5,
            color: '#888',
            marginBottom: 12,
            padding: '8px 12px',
            background: '#fafaf8',
            border: '1px solid #e8e8e4',
            borderRadius: 7,
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0, color: '#aaa' }} />
          <span>Lengkapi checklist persyaratan untuk mengakses fitur upload.</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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

  const fileStatusColor = isApproved ? '#16A34A' : isDeclined ? '#dc2626' : '#888';
  const fileStatusText = isApproved
    ? '✓ Terverifikasi'
    : isDeclined
      ? `Ditolak${doc?.notes ? `: ${doc.notes}` : ''}`
      : 'Menunggu verifikasi';

  const buttonBorderColor = isDeclined ? '#ef4444' : canUpload ? '#F59E0B' : '#e8e8e4';
  const buttonColor = isDeclined ? '#ef4444' : canUpload ? '#F59E0B' : '#bbb';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 10px',
        borderRadius: 7,
        background: '#fafaf8',
        border: '1px solid #eeece8',
        opacity: isLocked ? 0.55 : 1,
      }}
    >
      {/* File icon */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: isApproved ? '#dcfce7' : isDeclined ? '#fef2f2' : isUploaded ? '#dbeafe' : '#f3f4f6',
          color: isApproved ? '#16A34A' : isDeclined ? '#dc2626' : isUploaded ? '#2563eb' : '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <FileText size={14} />
      </div>

      {/* File info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            color: '#111',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {docType.label}
        </div>
        {isUploaded && (
          <>
            <div style={{ fontSize: 10, color: fileStatusColor, fontWeight: 500, marginTop: 1 }}>
              {fileStatusText}
            </div>
            {doc?.fileName && (
              <div
                style={{
                  fontSize: 10,
                  color: '#aaa',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {doc.fileName}
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptStr}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {isUploaded && doc?.filePath && (
          <button
            onClick={handleViewClick}
            title="Lihat dokumen"
            style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              background: '#f8f7f4',
              border: '1px solid #e8e8e4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#888',
              flexShrink: 0,
            }}
          >
            <Eye size={12} />
          </button>
        )}

        {isUploading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#888' }}>
            <Spinner className="h-3 w-3" />
            Upload...
          </div>
        ) : (
          <button
            disabled={!canUpload}
            onClick={handleUploadClick}
            style={{
              flexShrink: 0,
              padding: '4px 9px',
              border: `1px solid ${buttonBorderColor}`,
              background: 'transparent',
              color: buttonColor,
              fontSize: 10.5,
              fontWeight: 600,
              borderRadius: 5,
              cursor: canUpload ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
            }}
          >
            {isUploaded ? (isDeclined ? 'Upload Ulang' : 'Ganti File') : 'Upload'}
          </button>
        )}
      </div>
    </div>
  );
}
