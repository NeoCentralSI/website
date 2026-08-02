import { useRef } from 'react';
import { AlertCircle, Eye, FileText, Upload } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { useUploadDefenceDocument } from '@/hooks/thesis-defence/useStudentThesisDefence';
import type {
  DefenceRequirement,
  DefenceRequirementConfiguration,
  DefenceUploadConfig,
} from '@/types/defence.types';
import { openProtectedFile } from '@/lib/protected-file';
import { fetchDefenceDocumentBlob } from '@/services/thesis-defence/doc.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StudentThesisDefenceDocumentCardProps {
  requirements: DefenceRequirement[];
  canUpload: boolean;
  configuration: DefenceRequirementConfiguration;
  uploadConfig: DefenceUploadConfig;
}

export function StudentThesisDefenceDocumentCard({
  requirements,
  canUpload,
  configuration,
  uploadConfig,
}: StudentThesisDefenceDocumentCardProps) {
  const uploadMutation = useUploadDefenceDocument();

  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px]">
      <div className="flex items-center justify-between gap-3 mb-[14px]">
        <div className="text-base font-semibold text-foreground">Upload Dokumen Sidang</div>
        <span className="text-xs text-muted-foreground">PDF, maks. {uploadConfig.maxFileSizeMb} MB</span>
      </div>

      {!configuration.isConfigured ? (
        <Notice>{configuration.message || 'Syarat dokumen sidang belum dikonfigurasi.'}</Notice>
      ) : !canUpload && requirements.some((item) => !item.document) ? (
        <Notice>
          Lengkapi checklist persyaratan terlebih dahulu. Dokumen yang sudah disetujui tetap terkunci.
        </Notice>
      ) : null}

      {configuration.isConfigured && requirements.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada syarat dokumen untuk percobaan sidang ini.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {requirements.map((requirement) => (
            <DocumentRow
              key={requirement.id}
              requirement={requirement}
              canUpload={canUpload}
              uploadConfig={uploadConfig}
              isUploading={
                uploadMutation.isPending &&
                uploadMutation.variables?.requirementId === requirement.id
              }
              onUpload={(file) => uploadMutation.mutate({ file, requirementId: requirement.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs text-muted-foreground mb-3 p-[8px_12px] bg-muted border border-gray-200 rounded-[7px]">
      <AlertCircle size={14} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

interface DocumentRowProps {
  requirement: DefenceRequirement;
  canUpload: boolean;
  uploadConfig: DefenceUploadConfig;
  isUploading: boolean;
  onUpload: (file: File) => void;
}

function DocumentRow({ requirement, canUpload, uploadConfig, isUploading, onUpload }: DocumentRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const document = requirement.document;
  const isApproved = document?.status === 'approved';
  const isDeclined = document?.status === 'declined';
  const uploadEnabled = canUpload && !isApproved && !isUploading;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
      toast.error('Format dokumen tidak didukung. Gunakan file PDF.');
      return;
    }
    if (file.size > uploadConfig.maxFileSizeBytes) {
      toast.error(`Ukuran file maksimal ${uploadConfig.maxFileSizeMb} MB.`);
      return;
    }
    onUpload(file);
  };

  const handleView = async () => {
    if (!requirement.document) return;
    try {
      const blob = await fetchDefenceDocumentBlob(requirement.document.thesisDefenceId, requirement.id);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuka dokumen.');
    }
  };

  const statusText = isApproved
    ? 'Terverifikasi'
    : isDeclined
      ? 'Ditolak'
      : document
        ? 'Menunggu verifikasi'
        : 'Belum diunggah';

  return (
    <div
      className={cn(
        'flex items-center gap-[10px] p-[9px_10px] rounded-[7px] bg-card border border-gray-200',
        !uploadEnabled && !document && 'opacity-60'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
          isApproved
            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
            : isDeclined
              ? 'border-red-200 bg-red-50 text-red-600'
              : document
                ? 'border-blue-200 bg-blue-50 text-blue-600'
                : 'border-primary/20 bg-primary/5 text-primary'
        )}
      >
        <FileText className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold text-foreground">{requirement.name}</div>
        {requirement.description ? (
          <div className="mt-0.5 line-clamp-1 text-xs leading-5 text-muted-foreground">
            {requirement.description}
          </div>
        ) : null}
        <div className="mt-1.5 flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
              isApproved
                ? 'bg-emerald-50 text-emerald-700'
                : isDeclined
                  ? 'bg-red-50 text-red-700'
                  : document
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-muted text-muted-foreground'
            )}
          >
            {statusText}
          </span>
          {document?.fileName ? (
            <span className="min-w-0 truncate text-[11px] font-medium text-slate-500" title={document.fileName}>
              File: {document.fileName}
            </span>
          ) : null}
        </div>
        {isDeclined && document?.notes ? (
          <div className="mt-1 line-clamp-1 text-[11px] text-red-600" title={document.notes}>
            Catatan: {document.notes}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={uploadConfig.accept.join(',')}
          className="hidden"
          onChange={handleFileChange}
        />
        {document?.filePath ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleView}
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
            {document ? 'Ganti File' : 'Upload'}
          </Button>
        )}
      </div>
    </div>
  );
}
