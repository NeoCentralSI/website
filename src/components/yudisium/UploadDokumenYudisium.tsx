import { useRef, useCallback } from 'react';
import { FileText, Upload, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  useStudentYudisiumRequirements,
  useUploadYudisiumDocument,
} from '@/hooks/yudisium/useStudentYudisium';
import type { YudisiumRequirementUploadStatus } from '@/types/studentYudisium.types';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';

interface UploadDokumenYudisiumProps {
  allChecklistMet: boolean;
}

export function UploadDokumenYudisium({ allChecklistMet }: UploadDokumenYudisiumProps) {
  const isLocked = !allChecklistMet;

  const { data: reqData } = useStudentYudisiumRequirements();
  const uploadMutation = useUploadYudisiumDocument();

  const requirements = reqData?.requirements ?? [];

  return (
    <div className="rounded-lg border border-gray-200 bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Dokumen Yudisium</h3>

      {isLocked && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-3 bg-muted/30 rounded-md">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Lengkapi checklist persyaratan untuk mengakses fitur upload.</span>
        </div>
      )}

      <div className="space-y-3">
        {requirements.map((req) => (
          <RequirementRow
            key={req.id}
            requirement={req}
            isLocked={isLocked}
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

interface RequirementRowProps {
  requirement: YudisiumRequirementUploadStatus;
  isLocked: boolean;
  isUploading: boolean;
  onUpload: (file: File) => void;
}

function RequirementRow({ requirement, isLocked, isUploading, onUpload }: RequirementRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploaded = !!requirement.document;
  const isApproved = requirement.status === 'approved';
  const isDeclined = requirement.status === 'declined';
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

  const handleViewClick = useCallback(async () => {
    if (requirement.document?.filePath) {
      try {
        await openProtectedFile(
          requirement.document.filePath,
          requirement.document.fileName || undefined
        );
      } catch (error) {
        toast.error((error as Error).message || 'Gagal membuka dokumen');
      }
    }
  }, [requirement.document]);

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
          <p className="text-sm font-medium truncate">{requirement.name} (PDF)</p>
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
                {isDeclined && `Ditolak${requirement.validationNotes ? `: ${requirement.validationNotes}` : ''}`}
                {!isApproved && !isDeclined && 'Menunggu verifikasi'}
              </p>
              {requirement.document?.fileName && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {requirement.document.fileName}
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
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {isUploaded && requirement.document?.filePath && (
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
