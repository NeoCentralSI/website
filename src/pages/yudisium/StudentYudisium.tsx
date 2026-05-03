import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  Check,
  Clock,
  Calendar,
  BookOpen,
  Download,
  PartyPopper,
  FileText,
  Upload,
  Info,
  CalendarX2,
  AlertCircle,
  Eye,
  RefreshCw,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  useStudentYudisiumOverview,
  useStudentYudisiumRequirements,
  useUploadYudisiumDocument,
} from '@/hooks/yudisium/useYudisiumStudent';
import type {
  StudentYudisiumChecklistItem,
  YudisiumRequirementUploadStatus,
} from '@/types/student-yudisium.types';
import { formatDateOnlyId } from '@/lib/text';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDateTime = (date: string | null | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
};

const formatDateOnly = (date: string | null | undefined) => {
  if (!date) return '-';
  return formatDateOnlyId(date);
};

const checklistEntries = (checklist: Record<string, StudentYudisiumChecklistItem>) =>
  Object.entries(checklist).map(([key, value]) => ({ key, ...value }));

// ─── Types ───────────────────────────────────────────────────────────────────

type YudisiumDisplayStatus = 'draft' | 'open' | 'closed' | 'scheduled' | 'ongoing' | 'completed';
type ParticipantStatus = 'registered' | 'verified' | 'cpl_validated' | 'appointed' | 'finalized' | 'rejected' | null;

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'checklist', label: 'Checklist Persyaratan' },
  { key: 'documents', label: 'Dokumen Yudisium Lengkap' },
  { key: 'cpl', label: 'Nilai CPL Tervalidasi' },
  { key: 'schedule', label: 'Penetapan Jadwal Yudisium' },
  { key: 'yudisium', label: 'Pelaksanaan Yudisium' },
] as const;

const STATUS_BADGE_MAP: Record<YudisiumDisplayStatus, { label: string; className: string }> = {
  draft:     { label: 'Belum Dibuka',          className: 'bg-gray-100 text-gray-600 border-gray-200' },
  open:      { label: 'Pendaftaran Dibuka',     className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed:    { label: 'Pendaftaran Ditutup',    className: 'bg-amber-50 text-amber-700 border-amber-200' },
  scheduled: { label: 'Terjadwalkan',           className: 'bg-blue-50 text-blue-700 border-blue-200' },
  ongoing:   { label: 'Sedang Berlangsung',     className: 'bg-violet-50 text-violet-700 border-violet-200' },
  completed: { label: 'Selesai',               className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const PARTICIPANT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  registered:    { label: 'Terdaftar',           className: 'bg-blue-50 text-blue-700 border-blue-200' },
  verified:      { label: 'Terverifikasi',       className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cpl_validated: { label: 'CPL Tervalidasi',     className: 'bg-violet-50 text-violet-700 border-violet-200' },
  appointed:     { label: 'Terjadwalkan',        className: 'bg-blue-50 text-blue-700 border-blue-200' },
  finalized:     { label: 'Selesai',             className: 'bg-slate-100 text-slate-600 border-slate-200' },
  rejected:      { label: 'Tidak Memenuhi Persyaratan', className: 'bg-red-50 text-red-700 border-red-200' },
};

// ─── Status Derivation ───────────────────────────────────────────────────────

function deriveDisplayStatus(
  storedStatus: string,
  registrationOpenDate: string | null,
  registrationCloseDate: string | null,
  eventDate: string | null,
): YudisiumDisplayStatus {
  const now = new Date();
  if (storedStatus === 'completed') return 'completed';
  if (storedStatus === 'scheduled') {
    if (eventDate) {
      const ed = new Date(eventDate);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);
      if (ed >= todayStart && ed <= todayEnd) return 'ongoing';
      if (ed < todayStart) return 'completed';
    }
    return 'scheduled';
  }
  const openDate = registrationOpenDate ? new Date(registrationOpenDate) : null;
  const closeDate = registrationCloseDate ? new Date(registrationCloseDate) : null;
  if (!openDate || now < openDate) return 'draft';
  if (closeDate && now > closeDate) return 'closed';
  return 'open';
}

function getActiveStepIndex(
  displayStatus: YudisiumDisplayStatus,
  participantStatus: ParticipantStatus,
  allChecklistMet: boolean,
  allDocumentsUploaded: boolean,
  allCplVerified: boolean,
  hasDecree: boolean,
): number {
  // Only show as completed if the student was actually part of the yudisium (has a status)
  if (participantStatus === 'finalized' || (displayStatus === 'completed' && participantStatus)) return 4;
  if (!allChecklistMet) return -1;
  const isPastDocumentValidation = ['verified', 'cpl_validated', 'appointed', 'finalized'].includes(participantStatus ?? '');
  if (!allDocumentsUploaded && !isPastDocumentValidation) return 0;
  if (!allCplVerified) return 1;
  if (!hasDecree) return 2;
  return 3;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StudentYudisiumStatusCard({ currentStep, isFinalized }: { currentStep: number; isFinalized: boolean }) {
  const spinePct = currentStep === -1 ? 0 : (currentStep + 1) * 20;
  const completedCount = currentStep + 1;

  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[18px_18px_14px] h-full flex flex-col box-border">
      <div className="text-base font-semibold text-foreground mb-1.5 flex items-center justify-between">
        Status Yudisium
        {isFinalized && (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 h-5 px-1.5 text-[10px]">
            <PartyPopper className="mr-1 h-2.5 w-2.5" />
            Selesai
          </Badge>
        )}
      </div>
      <div className="text-xs text-muted-foreground mb-[18px]">
        Progres pengajuan yudisium Anda
      </div>

      <div className="relative pl-8 flex-1 flex flex-col">
        {STEPS.map((step, i) => {
          const isActive = i <= currentStep;

          return (
            <div
              key={step.key}
              className={cn(
                "relative",
                i < STEPS.length - 1 ? "pb-[22px]" : "pb-0"
              )}
            >
              {/* Segment to next node */}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute top-[13px] bottom-[-13px] w-[2px] z-[0]",
                    i < currentStep ? "bg-[#16A34A]" : "bg-muted"
                  )}
                  style={{ left: '-21px' }}
                />
              )}
              {/* Node */}
              <div
                className={cn(
                  "absolute -left-8 top-[2px] w-[22px] h-[22px] rounded-full flex items-center justify-center z-[1] border-[2.5px]",
                  isActive
                    ? "bg-[#16A34A] border-[#16A34A] text-white shadow-[0_0_0_3px_#dcfce7]"
                    : "bg-white border-[#d1d5db] text-[#bbb] shadow-[0_0_0_3px_#f3f4f6]"
                )}
              >
                {isActive ? (
                  <Check size={10} strokeWidth={2.5} />
                ) : (
                  <Clock size={10} strokeWidth={2} />
                )}
              </div>

              {/* Step name */}
              <div
                className={cn(
                  "text-sm font-semibold leading-[1.3] mb-0.5",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </div>

              {/* Step status */}
              <div
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  isActive ? "text-[#16A34A]" : "text-muted-foreground"
                )}
              >
                {isActive ? 'Terpenuhi' : 'Menunggu'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress summary */}
      <div className="mt-[18px] pt-[14px] border-t border-gray-200">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-muted-foreground font-medium">Progres Keseluruhan</span>
          <span className="text-xs font-bold text-[#16A34A]">{spinePct}%</span>
        </div>
        <div className="bg-muted rounded-full h-[6px] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-300"
            style={{ width: `${spinePct}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1.5 font-medium">
          {completedCount > 0 ? `${completedCount} dari ${STEPS.length} tahap selesai` : 'Checklist Persyaratan Belum Terpenuhi'}
        </div>
      </div>
    </div>
  );
}

function StudentYudisiumIdentityCard({
  yudisium,
  displayStatus,
  statusBadge,
  decreeDocument,
}: {
  yudisium: any;
  displayStatus: YudisiumDisplayStatus;
  statusBadge: any;
  decreeDocument: any;
}) {
  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px] transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-[14px]">
        <div className="text-base font-semibold text-foreground">Informasi Yudisium</div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusBadge.className)}>
            {statusBadge.label}
          </Badge>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4">
        <div className="flex flex-col gap-0.5">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <BookOpen size={12} className="opacity-50" />
            Periode
          </div>
          <div className="text-sm font-medium text-foreground truncate">
            {yudisium.name}
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Calendar size={12} className="opacity-50" />
            Rentang Pendaftaran
          </div>
          <div className="text-sm text-foreground font-medium">
            {formatDateOnly(yudisium.registrationOpenDate)} – {formatDateOnly(yudisium.registrationCloseDate)}
          </div>
        </div>

        {yudisium.eventDate && (
          <div className="flex flex-col gap-0.5">
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Calendar size={12} className="opacity-50" />
              Tanggal Pelaksanaan
            </div>
            <div className="text-sm text-foreground font-medium">
              {formatDateOnly(yudisium.eventDate)}
            </div>
          </div>
        )}

        {decreeDocument?.filePath && (
          <div className="flex flex-col gap-0.5">
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <FileText size={12} className="opacity-50" />
              SK Yudisium
            </div>
            <button
              onClick={async () => {
                try {
                  await openProtectedFile(decreeDocument.filePath, decreeDocument.fileName || 'SK-Yudisium.pdf');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Gagal mengunduh SK');
                }
              }}
              className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline cursor-pointer text-left p-0 bg-transparent border-0"
            >
              <Download size={12} />
              Unduh SK
            </button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {displayStatus === 'draft' && (
        <div className="mt-4 flex items-start gap-2 text-xs text-amber-600 bg-amber-50/50 border border-amber-200 p-2 rounded-md">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>Periode yudisium ini belum dibuka untuk pendaftaran. Upload dokumen akan diaktifkan saat pendaftaran dibuka.</span>
        </div>
      )}
      {displayStatus === 'closed' && (
        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-muted border border-gray-200 p-2 rounded-md">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>Pendaftaran sudah ditutup. Jika Anda belum terdaftar, silakan hubungi Koordinator Yudisium.</span>
        </div>
      )}
    </div>
  );
}

function ChecklistRow({
  label,
  met,
  current,
  required,
  submittedAt,
  revisionFinalizedAt,
  isExitSurvey,
  isYudisiumOpen,
  onExitSurveyClick,
}: {
  label: string;
  met: boolean;
  current?: number;
  required?: number;
  submittedAt?: string | null;
  revisionFinalizedAt?: string | null;
  isExitSurvey?: boolean;
  isYudisiumOpen?: boolean;
  onExitSurveyClick?: () => void;
}) {
  const hasProgress = current !== undefined && required !== undefined;
  const isInProgress = !met && hasProgress && current > 0;

  const statusText = met
    ? 'Terpenuhi'
    : isInProgress
      ? `${current}/${required}`
      : 'Menunggu';

  return (
    <div
      className={cn(
        "flex items-center gap-[10px] p-[8px_12px] rounded-[7px] border transition-all duration-200",
        met ? "bg-emerald-50/50 border-emerald-200" : "bg-card border border-gray-200"
      )}
    >
      <div
        className={cn(
          "w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0",
          met ? "bg-[#16A34A] text-white" : "bg-muted border-[1.5px] border-border text-muted-foreground"
        )}
      >
        {met ? <Check size={11} strokeWidth={2.5} /> : <Clock size={11} strokeWidth={2} />}
      </div>

      <div className="flex-1 min-w-0">
        <strong className="text-sm font-medium text-foreground block leading-tight truncate">
          {label}
        </strong>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("text-[10px] font-medium", met ? "text-[#16A34A]" : "text-muted-foreground")}>
            {statusText}
          </span>
          {submittedAt && (
            <span className="text-[10px] text-muted-foreground">
              • {formatDateTime(submittedAt)}
            </span>
          )}
          {revisionFinalizedAt && (
            <span className="text-[10px] text-muted-foreground">
              • {formatDateTime(revisionFinalizedAt)}
            </span>
          )}
        </div>
      </div>

      {isExitSurvey && (
        <button
          onClick={isYudisiumOpen ? onExitSurveyClick : undefined}
          disabled={!isYudisiumOpen && !met}
          className={cn(
            "shrink-0 px-[9px] py-[4px] text-[10px] font-semibold rounded-[5px] transition-all duration-200 border",
            met 
              ? "border-gray-200 text-foreground bg-transparent hover:bg-accent cursor-pointer" 
              : isYudisiumOpen 
                ? "border-primary text-primary bg-transparent hover:bg-primary/5 cursor-pointer" 
                : "border-gray-200 text-muted-foreground bg-transparent cursor-default opacity-50"
          )}
        >
          {met ? 'Lihat Response' : 'Isi Survey'}
        </button>
      )}
    </div>
  );
}

function StudentYudisiumChecklistCard({
  checklist,
  isYudisiumOpen,
  onExitSurveyClick,
}: {
  checklist: any;
  isYudisiumOpen: boolean;
  onExitSurveyClick: () => void;
}) {
  const items = checklistEntries(checklist);
  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px]">
      <div className="text-base font-semibold text-foreground mb-[14px]">
        Checklist Persyaratan
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item: any) => (
          <ChecklistRow
            key={item.key}
            label={item.label}
            met={item.met}
            current={item.current}
            required={item.required}
            submittedAt={item.submittedAt}
            revisionFinalizedAt={item.revisionFinalizedAt}
            isExitSurvey={item.key === 'exitSurvey'}
            isYudisiumOpen={isYudisiumOpen}
            onExitSurveyClick={onExitSurveyClick}
          />
        ))}
      </div>
    </div>
  );
}

function DocumentRow({
  requirement,
  isLocked,
  isUploading,
  onUpload,
}: {
  requirement: YudisiumRequirementUploadStatus;
  isLocked: boolean;
  isUploading: boolean;
  onUpload: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploaded = !!requirement.document;
  const isApproved = requirement.status === 'approved';
  const isDeclined = requirement.status === 'declined';
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
    if (requirement.document?.filePath) {
      try {
        await openProtectedFile(requirement.document.filePath, requirement.document.fileName || undefined);
      } catch (error) {
        toast.error((error as Error).message || 'Gagal membuka dokumen');
      }
    }
  };

  const fileStatusColor = isApproved ? 'text-[#16A34A]' : isDeclined ? 'text-[#dc2626]' : 'text-muted-foreground';
  const fileStatusText = isApproved
    ? '✓ Terverifikasi'
    : isDeclined
      ? `Ditolak${requirement.validationNotes ? `: ${requirement.validationNotes}` : ''}`
      : 'Menunggu verifikasi';

  return (
    <div
      className={cn(
        "flex items-center gap-[10px] p-[7px_10px] rounded-[7px] bg-card border border-gray-200 transition-all duration-200",
        isLocked && "opacity-[0.55]"
      )}
    >
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

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {requirement.name} (PDF)
        </div>
        {isUploaded && (
          <>
            <div className={cn("text-[10px] font-medium mt-0.5", fileStatusColor)}>
              {fileStatusText}
            </div>
            {requirement.document?.fileName && (
              <div className="text-[10px] text-muted-foreground truncate">
                {requirement.document.fileName}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {isUploaded && requirement.requirementId && (
          <button
            onClick={handleViewClick}
            title="Lihat dokumen"
            className="px-[9px] py-[4px] rounded-[5px] bg-transparent border border-gray-200 flex items-center gap-1 shrink-0 text-foreground hover:bg-accent transition-all duration-200 cursor-pointer text-[10px] font-semibold"
          >
            <Eye size={12} />
            <span>Lihat</span>
          </button>
        )}

        {isUploading ? (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Spinner className="h-3 w-3" />
            Upload...
          </div>
        ) : (
          <button
            disabled={!canUpload}
            onClick={handleUploadClick}
            className={cn(
              "shrink-0 px-[9px] py-[4px] text-[10px] font-semibold rounded-[5px] transition-all duration-200 cursor-pointer border",
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

function YudisiumRequirementCard({ allChecklistMet }: { allChecklistMet: boolean }) {
  const isLocked = !allChecklistMet;
  const { data: reqData } = useStudentYudisiumRequirements();
  const uploadMutation = useUploadYudisiumDocument();
  const requirements = reqData?.requirements ?? [];

  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px]">
      <div className="text-base font-semibold text-foreground mb-[14px]">
        Upload Dokumen Yudisium
      </div>
      {isLocked && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3 p-[8px_12px] bg-muted border border-gray-200 rounded-[7px]">
          <Info size={14} className="shrink-0 text-muted-foreground" />
          <span>Lengkapi checklist persyaratan untuk mengakses fitur upload.</span>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {requirements.map((req) => (
          <DocumentRow
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

function RequirementsPreviewCard({ requirements }: { requirements: { id: string; name: string; description?: string | null }[] }) {
  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px]">
      <div className="text-base font-semibold text-foreground mb-[6px]">
        Upload Dokumen Yudisium
      </div>
      <div className="text-xs text-muted-foreground mb-[14px]">
        Dokumen-dokumen berikut perlu disiapkan saat pendaftaran dibuka.
      </div>
      <div className="flex flex-col gap-1.5">
        {requirements.map((req) => (
          <div
            key={req.id}
            className="flex items-center gap-[10px] p-[7px_10px] rounded-[7px] bg-card border border-dashed border-gray-200 opacity-[0.55]"
          >
            <div className="w-7 h-7 rounded-[6px] bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <FileText size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {req.name} (PDF)
              </div>
              {req.description && (
                <div className="text-[10px] text-muted-foreground truncate">
                  {req.description}
                </div>
              )}
            </div>
            <button
              disabled
              className="shrink-0 px-[9px] py-[4px] text-[10px] font-semibold rounded-[5px] border border-gray-200 text-muted-foreground cursor-default"
            >
              Upload
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentYudisiumHistoryCard({
  index,
  item,
}: {
  index: number;
  item: any;
}) {
  const statusInfo = PARTICIPANT_STATUS_MAP[item.status] || { label: item.status, className: '' };

  return (
    <div className="grid grid-cols-[40px_1.5fr_1.5fr_1fr_1fr_1fr] gap-2 items-center p-[10px] bg-card border border-gray-200 rounded-[8px] transition-all duration-200">
      {/* # */}
      <span className="text-xs font-semibold text-muted-foreground">{index}</span>

      {/* Yudisium Name */}
      <div className="min-w-0 flex flex-col">
        <div className="truncate text-sm font-medium text-foreground">
          {item.yudisiumName}
        </div>
      </div>

      {/* Rentang Pendaftaran */}
      <div className="text-sm text-foreground font-medium">
        {formatDateOnly(item.registrationOpenDate)} – {formatDateOnly(item.registrationCloseDate)}
      </div>

      {/* Tanggal Pelaksanaan */}
      <div className="text-sm text-foreground font-medium">
        {formatDateOnly(item.eventDate)}
      </div>

      {/* Date Submitted */}
      <div className="text-sm text-foreground font-medium">
        {formatDateOnly(item.createdAt)}
      </div>

      {/* Status */}
      <div className="flex justify-start">
        <Badge variant="outline" className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusInfo.className)}>
          {statusInfo.label}
        </Badge>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function StudentYudisium() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useStudentYudisiumOverview();

  const breadcrumbs = useMemo(() => [
    { label: 'Yudisium' }
  ], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Yudisium Mahasiswa');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  // ── Derived state ───────────────────────────────────────────────────────

  const displayStatus = data?.yudisium
    ? deriveDisplayStatus(
        data.yudisium.status,
        data.yudisium.registrationOpenDate ?? null,
        data.yudisium.registrationCloseDate ?? null,
        data.yudisium.eventDate ?? null,
      )
    : null;

  const isRegistrationOpen = displayStatus === 'open';
  const hasActiveYudisium  = !!data?.yudisium;
  const allDocumentsUploaded = (data?.requirements ?? []).every((r) => r.isUploaded);
  const hasDecree          = !!(data?.yudisium?.decreeDocument);

  const currentStep = getActiveStepIndex(
    displayStatus ?? 'draft',
    (data?.participantStatus as ParticipantStatus) ?? null,
    data?.allChecklistMet ?? false,
    allDocumentsUploaded,
    data?.allCplVerified ?? false,
    hasDecree,
  );
  const isFinalized = currentStep >= 4;
  const statusBadge = displayStatus ? STATUS_BADGE_MAP[displayStatus] : STATUS_BADGE_MAP.draft;

  if (isLoading) {
    return (
      <div className="p-6 space-y-[14px]">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-[14px]">
          <Skeleton className="h-96" />
          <div className="space-y-[14px]">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yudisium Mahasiswa</h1>
          <p className="text-muted-foreground">
            Pantau kesiapan checklist yudisium dan dokumen persyaratan Anda.
          </p>
        </div>
      </div>

      {/* Header Info Banner / Glass Card */}
      {!hasActiveYudisium ? (
        <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 backdrop-blur-sm px-6 py-5 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarX2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Belum ada periode yudisium yang dibuka</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Persiapkan persyaratan di bawah ini. Upload dokumen dan exit survey akan aktif saat periode dibuka.
            </p>
          </div>
          <button 
            onClick={() => refetch()}
            className="ml-auto shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-all cursor-pointer"
          >
            Muat Ulang
          </button>
        </div>
      ) : (
        <StudentYudisiumIdentityCard 
          yudisium={data.yudisium} 
          displayStatus={displayStatus!} 
          statusBadge={statusBadge}
          decreeDocument={data.yudisium.decreeDocument}
        />
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-[14px] items-start">
        {/* Left: Vertical Roadmap */}
        <div className="self-stretch">
          <StudentYudisiumStatusCard currentStep={currentStep} isFinalized={isFinalized} />
        </div>

        {/* Right Column Stack */}
        <div className="flex flex-col gap-[14px]">
          {/* Checklist Card */}
          <StudentYudisiumChecklistCard 
            checklist={data.checklist} 
            isYudisiumOpen={isRegistrationOpen}
            onExitSurveyClick={() => navigate('/yudisium/exit-survey')}
          />

          {/* Document Upload/Preview Card */}
          {isRegistrationOpen ? (
            <YudisiumRequirementCard allChecklistMet={data?.allChecklistMet ?? false} />
          ) : (
            <RequirementsPreviewCard requirements={data?.requirements ?? []} />
          )}

          {/* CPL Scores Card — show whenever scores exist, regardless of active period */}
          {(data?.cplScores.length ?? 0) > 0 && (
            <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px]">
              <div className="flex items-center justify-between mb-[14px]">
                <div className="text-base font-semibold text-foreground">Validasi CPL</div>
                {data?.allCplVerified && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 h-5 px-1.5 text-[10px]">
                    <Check className="mr-1 h-2.5 w-2.5" strokeWidth={3} />
                    Tervalidasi
                  </Badge>
                )}
              </div>
              
              {data?.allCplVerified && (
                <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5">
                  <p className="text-[11px] font-medium text-emerald-700">
                    Selamat! Anda telah menjadi <strong>Calon Peserta Yudisium</strong>.
                  </p>
                </div>
              )}

              <div className="overflow-x-auto rounded-[8px] border border-gray-100">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kode</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Deskripsi</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nilai</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Minimal Skor</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Status</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Diverifikasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.cplScores.map((cpl: any, idx: number) => {
                      const isVerified = !!(cpl.verifiedBy && cpl.verifiedAt);
                      return (
                        <tr key={idx} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 py-2 text-xs font-semibold text-foreground">{cpl.code ?? '-'}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground max-w-[45ch] whitespace-normal leading-relaxed py-3">{cpl.description}</td>
                          <td className="px-3 py-2 text-xs font-bold text-foreground">{cpl.score ?? '-'}</td>
                          <td className="px-3 py-2 text-xs font-medium text-muted-foreground">{cpl.minimalScore}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded",
                              cpl.status === 'verified' || cpl.passed
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-600"
                            )}>
                              {cpl.status === 'verified' ? 'VALID' : cpl.passed ? 'LULUS' : 'TIDAK LULUS'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex justify-end">
                              {isVerified ? (
                                <div className="bg-emerald-100 text-emerald-600 p-0.5 rounded-full" title={`Diverifikasi pada ${formatDateTime(cpl.verifiedAt)}`}>
                                  <Check size={10} strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="bg-gray-100 text-gray-400 p-0.5 rounded-full">
                                  <X size={10} strokeWidth={3} />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Riwayat Percobaan — matching Thesis Defence layout */}
      {(data?.history?.length ?? 0) > 0 && (
        <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px]">
          {/* Card header */}
          <div className="flex items-center justify-between mb-[14px]">
            <div className="text-base font-semibold text-foreground">Riwayat Percobaan</div>
            <span className="text-xs text-muted-foreground font-medium">
              {data.history.length} pendaftaran sebelumnya
            </span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[40px_1.5fr_1.5fr_1fr_1fr_1fr] gap-2 px-[10px] py-[6px] mb-[6px]">
            {['#', 'Periode', 'Pendaftaran', 'Pelaksanaan', 'Tgl. Daftar', 'Status'].map((col, i) => (
              <span
                key={i}
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {col}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-2">
            {data.history.map((item: any, idx: number) => (
              <StudentYudisiumHistoryCard
                key={item.id}
                index={idx + 1}
                item={item}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
