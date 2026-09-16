import { useRef } from 'react';
import { AlertCircle, Eye, FileText, Upload } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import {
  useStudentYudisiumRequirements,
  useUploadYudisiumDocument,
} from '@/hooks/yudisium/useYudisiumStudent';
import type { YudisiumRequirementUploadStatus } from '@/types/student-yudisium.types';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DocumentRowProps {
  requirement: YudisiumRequirementUploadStatus;
  isLocked: boolean;
  isUploading: boolean;
  onUpload: (file: File) => void;
}

function DocumentRow({ requirement, isLocked, isUploading, onUpload }: DocumentRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploaded = !!requirement.document;
  const isApproved = requirement.status === 'approved';
  const isDeclined = requirement.status === 'declined';
  const uploadEnabled = !isLocked && !isApproved && !isUploading;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
      toast.error('Format dokumen tidak didukung. Gunakan file PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10 MB.');
      return;
    }
    onUpload(file);
  };

  const handleViewClick = async () => {
    if (requirement.document?.filePath) {
      try {
        await openProtectedFile(requirement.document.filePath, requirement.document.fileName || undefined);
      } catch (error) {
        toast.error((error as Error).message || 'Gagal membuka dokumen');
      }
    }
  };

  const statusText = isApproved
    ? 'Terverifikasi'
    : isDeclined
      ? 'Ditolak'
      : isUploaded
        ? 'Menunggu verifikasi'
        : 'Belum diunggah';

  return (
    <div
      className={cn(
        'flex items-center gap-[10px] rounded-[7px] border border-gray-200 bg-card p-[9px_10px]',
        !uploadEnabled && !isUploaded && 'opacity-60'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
          isApproved
            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
            : isDeclined
              ? 'border-red-200 bg-red-50 text-red-600'
              : isUploaded
                ? 'border-blue-200 bg-blue-50 text-blue-600'
                : 'border-primary/20 bg-primary/5 text-primary'
        )}
      >
        <FileText className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold text-foreground">
          {requirement.name}
        </div>
        {typeof requirement.description === 'string' && requirement.description && (
          <div className="mt-0.5 line-clamp-1 text-xs leading-5 text-muted-foreground">
            {requirement.description}
          </div>
        )}
        <div className="mt-1.5 flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
              isApproved
                ? 'bg-emerald-50 text-emerald-700'
                : isDeclined
                  ? 'bg-red-50 text-red-700'
                  : isUploaded
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-muted text-muted-foreground'
            )}
          >
            {statusText}
          </span>
          {requirement.document?.fileName ? (
            <span className="min-w-0 truncate text-[11px] font-medium text-slate-500" title={requirement.document.fileName}>
              File: {requirement.document.fileName}
            </span>
          ) : null}
        </div>
        {isDeclined && requirement.validationNotes ? (
          <div className="mt-1 line-clamp-1 text-[11px] text-red-600" title={requirement.validationNotes}>
            Catatan: {requirement.validationNotes}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {isUploaded && requirement.id ? (
          <Button
            type="button"
            onClick={handleViewClick}
            variant="outline"
            size="sm"
            className="border-primary/40 text-primary hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            <Eye className="mr-2 h-4 w-4" />
            Lihat
          </Button>
        ) : null}

        {isUploading ? (
          <Button type="button" variant="outline" size="sm" disabled>
            <Spinner className="mr-2 h-4 w-4" />
            Mengunggah
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!uploadEnabled}
            onClick={() => fileInputRef.current?.click()}
            className="border-primary/40 text-primary hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploaded ? 'Ganti File' : 'Upload'}
          </Button>
        )}
      </div>
    </div>
  );
}

interface StudentYudisiumDocumentCardProps {
  allChecklistMet: boolean;
  participantStatus: string | null;
  isRegistrationOpen: boolean;
  fallbackRequirements?: { id: string; name: string; description?: string | null }[];
}

export function StudentYudisiumDocumentCard({
  allChecklistMet,
  participantStatus,
  isRegistrationOpen,
  fallbackRequirements = [],
}: StudentYudisiumDocumentCardProps) {
  const isLocked = !allChecklistMet || !isRegistrationOpen;
  const isChecklistLocked = !allChecklistMet && isRegistrationOpen;
  const isBeyondVerification = ['eligible', 'appointed', 'finalized'].includes(participantStatus ?? '');

  const { data: reqData } = useStudentYudisiumRequirements();
  const uploadMutation = useUploadYudisiumDocument();

  const requirements = (reqData?.requirements?.length ? reqData.requirements : fallbackRequirements.map((req) => ({
    id: req.id,
    name: req.name,
    description: req.description ?? null,
    notes: null,
    status: null,
    submittedAt: null,
    verifiedAt: null,
    validationNotes: null,
    document: null,
  }))) as YudisiumRequirementUploadStatus[];

  const shouldShowGuideOnly = !isRegistrationOpen && !participantStatus;

  if (!isRegistrationOpen && !participantStatus) {
    return (
      <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px]">
        <div className="flex items-center justify-between gap-3 mb-[6px]">
          <div className="text-base font-semibold text-foreground">Upload Dokumen Yudisium</div>
          <span className="text-xs text-muted-foreground">PDF, maks. 10 MB</span>
        </div>
        <div className="text-xs text-muted-foreground mb-[14px]">
          Dokumen-dokumen berikut perlu disiapkan saat pendaftaran dibuka.
        </div>
        <div className="flex flex-col gap-1.5">
          {requirements.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-[10px] rounded-[7px] border border-dashed border-gray-200 bg-card p-[9px_10px] opacity-60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">
                  {req.name} (PDF)
                </div>
                {typeof req.description === 'string' && req.description && (
                  <div className="mt-0.5 line-clamp-1 text-xs leading-5 text-muted-foreground">
                    {req.description}
                  </div>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" disabled className="border-primary/40 text-primary">
                Upload
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px]">
      <div className="flex items-center justify-between gap-3 mb-[14px]">
        <div className="text-base font-semibold text-foreground">Upload Dokumen Yudisium</div>
        <span className="text-xs text-muted-foreground">PDF, maks. 10 MB</span>
      </div>

      {(isChecklistLocked && !isBeyondVerification) && (
        <Notice>
          Lengkapi checklist persyaratan terlebih dahulu. Dokumen yang sudah disetujui tetap terkunci.
        </Notice>
      )}

      <div className="flex flex-col gap-1.5">
        {requirements.map((req) => (
          <DocumentRow
            key={req.id}
            requirement={req}
            isLocked={(isLocked || isBeyondVerification) && !shouldShowGuideOnly}
            isUploading={
              uploadMutation.isPending &&
              uploadMutation.variables?.requirementId === req.id
            }
            onUpload={(file) =>
              uploadMutation.mutate({ file, requirementId: req.id })
            }
          />
        ))}
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-start gap-2 rounded-[7px] border border-gray-200 bg-muted p-[8px_12px] text-xs text-muted-foreground">
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
