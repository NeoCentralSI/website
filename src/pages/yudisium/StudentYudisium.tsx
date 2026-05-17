import { useEffect, useMemo, useRef, useState } from 'react';
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
  Info,
  CalendarX2,
  AlertCircle,
	  Eye,
	  X,
	  MapPin,
	} from 'lucide-react';
import {
  useStudentYudisiumOverview,
  useStudentYudisiumRequirements,
  useUploadYudisiumDocument,
} from '@/hooks/yudisium/useYudisiumStudent';
import { downloadStudentCertificate } from '@/services/yudisium/student.service';
import type {
  StudentYudisiumChecklistItem,
  StudentYudisiumOverviewResponse,
  YudisiumRequirementUploadStatus,
} from '@/types/student-yudisium.types';
import {
  formatDateOnlyId
} from '@/lib/text';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import CustomTable, { type Column } from '@/components/layout/CustomTable';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDateTime = (date: any) => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!(d instanceof Date) || isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  } catch (err) {
    return '-';
  }
};

const formatDateOnly = (date: string | null | undefined) => {
  if (!date) return '-';
  return formatDateOnlyId(date);
};

const checklistEntries = (checklist: Record<string, StudentYudisiumChecklistItem>) =>
  Object.entries(checklist).map(([key, value]) => ({ key, ...value }));

// ─── Types ───────────────────────────────────────────────────────────────────

type YudisiumDisplayStatus = 'draft' | 'open' | 'closed' | 'ongoing' | 'completed';
type ParticipantStatus = 'registered' | 'verified' | 'cpl_validated' | 'appointed' | 'finalized' | 'rejected' | null;
type StudentCplScore = NonNullable<StudentYudisiumOverviewResponse['cplScores']>[number];

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'checklist', label: 'Checklist Persyaratan' },
  { key: 'documents', label: 'Dokumen Yudisium Lengkap' },
  { key: 'cpl', label: 'Nilai CPL Tervalidasi' },
  { key: 'appointed', label: 'Ditetapkan sebagai Peserta Yudisium' },
  { key: 'finalized', label: 'Yudisium Selesai' },
] as const;

const STATUS_BADGE_MAP: Record<YudisiumDisplayStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' },
  open: { label: 'Pendaftaran Dibuka', className: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' },
  closed: { label: 'Pendaftaran Ditutup', className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  ongoing: { label: 'Sedang Berlangsung', className: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
  completed: { label: 'Selesai', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
};

const PARTICIPANT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  registered: { label: 'Menunggu Verifikasi Dokumen', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  verified: { label: 'Menunggu Validasi CPL', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  cpl_validated: { label: 'Calon Peserta Yudisium', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  appointed: { label: 'Peserta Yudisium', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  finalized: { label: 'Lulus Yudisium', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Tidak Memenuhi Persyaratan', className: 'bg-red-50 text-red-700 border-red-200' },
};

// ─── Status Derivation ───────────────────────────────────────────────────────

function deriveDisplayStatus(
  _storedStatus: string,
  registrationOpenDate: string | null,
  registrationCloseDate: string | null,
  eventDate: string | null,
): YudisiumDisplayStatus {
  const now = new Date();
  if (eventDate) {
    const ed = new Date(eventDate);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);
    if (ed >= todayStart && ed <= todayEnd) return 'ongoing';
    if (ed < todayStart) return 'completed';
  }
  const openDate = registrationOpenDate ? new Date(registrationOpenDate) : null;
  const closeDate = registrationCloseDate ? new Date(registrationCloseDate) : null;
  if (!openDate || now < openDate) return 'draft';
  if (closeDate && now > closeDate) return 'closed';
  return 'open';
}

function getActiveStepIndex(
  participantStatus: ParticipantStatus,
  allChecklistMet: boolean,
): number {
  if (participantStatus === 'finalized') return 4;
  if (participantStatus === 'appointed') return 3;
  if (participantStatus === 'cpl_validated') return 2;
  if (participantStatus === 'verified') return 1;
  if (allChecklistMet) return 0;
  return -1;
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
  participantStatusBadge,
  decreeDocument,
  canDownloadCertificate,
  onDownloadCertificate,
}: {
  yudisium: any;
  displayStatus: YudisiumDisplayStatus;
  statusBadge: any;
  participantStatusBadge: { label: string; className: string } | null;
  decreeDocument: any;
  canDownloadCertificate: boolean;
  onDownloadCertificate: () => void;
}) {
  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px] transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-[14px]">
        <div className="text-base font-semibold text-foreground">Informasi Yudisium</div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] font-semibold rounded-full leading-none", statusBadge.className)}>
            {statusBadge.label}
          </Badge>
          {participantStatusBadge && (
            <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] font-semibold rounded-full leading-none", participantStatusBadge.className)}>
              {participantStatusBadge.label}
            </Badge>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-y-3 gap-x-4">
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

        <div className="flex flex-col gap-0.5">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Calendar size={12} className="opacity-50" />
            Tanggal Pelaksanaan
          </div>
          <div className="text-sm text-foreground font-medium">
            {formatDateOnly(yudisium.eventDate)}
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <MapPin size={12} className="opacity-50" />
            Ruangan
          </div>
          <div className="text-sm text-foreground font-medium truncate">
            {yudisium.room?.name ?? '-'}
          </div>
        </div>
      </div>

      {(decreeDocument?.filePath || canDownloadCertificate) && (
        <div className="mt-[14px] flex flex-wrap items-center gap-2">
          {decreeDocument?.filePath && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold"
              onClick={async () => {
                try {
                  await openProtectedFile(decreeDocument.filePath, decreeDocument.fileName || 'SK-Yudisium.pdf');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Gagal mengunduh SK');
                }
              }}
            >
              <Download size={14} />
              Unduh SK
            </Button>
          )}
          {canDownloadCertificate && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold"
              onClick={onDownloadCertificate}
            >
              <Download size={14} />
              Download Sertifikat
            </Button>
          )}
        </div>
      )}

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
  canAccessExitSurvey,
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
  canAccessExitSurvey?: boolean;
  onExitSurveyClick?: () => void;
}) {
  const hasProgress = current !== undefined && required !== undefined;
  const isInProgress = !met && hasProgress && current > 0;

  const statusText = met
    ? 'Terpenuhi'
    : isInProgress
      ? `${current}/${required}`
      : 'Menunggu';
  const exitSurveyDisabledReason =
    isExitSurvey && !met && !canAccessExitSurvey
      ? isYudisiumOpen
        ? 'Lengkapi seluruh persyaratan akademik terlebih dahulu'
        : 'Exit survey aktif saat pendaftaran yudisium dibuka'
      : null;

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
        {exitSurveyDisabledReason && (
          <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
            {exitSurveyDisabledReason}
          </p>
        )}
      </div>

      {isExitSurvey && (
        <button
          onClick={(canAccessExitSurvey || met) ? onExitSurveyClick : undefined}
          disabled={!canAccessExitSurvey && !met}
          className={cn(
            "shrink-0 px-[9px] py-[4px] text-[10px] font-semibold rounded-[5px] transition-all duration-200 border",
            met
              ? "border-gray-200 text-foreground bg-transparent hover:bg-accent cursor-pointer"
              : canAccessExitSurvey
                ? "border-primary text-primary bg-transparent hover:bg-primary/5 cursor-pointer"
                : "border-gray-200 text-muted-foreground bg-transparent cursor-default opacity-50"
          )}
          title={
            exitSurveyDisabledReason ?? undefined
          }
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
  if (!checklist) return null;
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
            canAccessExitSurvey={item.key === 'exitSurvey' ? !!item.isAvailable : undefined}
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
        (isLocked && !isApproved) && "opacity-[0.55]"
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
          {requirement.name}
        </div>
        {typeof requirement.description === 'string' && requirement.description && (
          <div className="text-xs text-muted-foreground leading-tight mt-0.5">
            {requirement.description}
          </div>
        )}
        {isUploaded && (
          <>
            <div className={cn("text-xs font-medium mt-0.5", fileStatusColor)}>
              {fileStatusText}
            </div>
            {requirement.document?.fileName && (
              <div className="text-xs text-muted-foreground truncate">
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

        {isUploaded && requirement.id && (
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

function YudisiumRequirementCard({
  allChecklistMet,
  participantStatus,
  isRegistrationOpen,
  fallbackRequirements = [],
}: {
  allChecklistMet: boolean;
  participantStatus: ParticipantStatus;
  isRegistrationOpen: boolean;
  fallbackRequirements?: { id: string; name: string; description?: string | null }[];
}) {
  const isLocked = !allChecklistMet || !isRegistrationOpen;
  const isChecklistLocked = !allChecklistMet && isRegistrationOpen;
  const isBeyondVerification = ['verified', 'cpl_validated', 'appointed', 'finalized'].includes(participantStatus ?? '');

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

  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px]">
      <div className="text-base font-semibold text-foreground mb-[14px]">
        Upload Dokumen Yudisium
      </div>
      {(isChecklistLocked && !isBeyondVerification) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 p-[8px_12px] bg-amber-50 border border-amber-200 rounded-[7px]">
          <AlertCircle size={14} className="shrink-0 text-muted-foreground" />
          <span>Lengkapi checklist persyaratan untuk mengakses fitur upload.</span>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {requirements.map((req) => (
          <DocumentRow
            key={req.id}
            requirement={req}
            isLocked={isLocked || isBeyondVerification}
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
              {typeof req.description === 'string' && req.description && (
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
  onOpen,
}: {
  index: number;
  item: any;
  onOpen: () => void;
}) {
  const statusInfo = PARTICIPANT_STATUS_MAP[item.status] || { label: item.status, className: '' };

  return (
    <button
      type="button"
      onClick={onOpen}
      className="grid w-full grid-cols-[40px_1.5fr_1.5fr_1fr_1fr_1fr] gap-2 items-center p-[10px] bg-card border border-gray-200 rounded-[8px] text-left transition-all duration-200 hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
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
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function StudentYudisium() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useStudentYudisiumOverview();
  const [cplSearch, setCplSearch] = useState('');
  const [cplPage, setCplPage] = useState(1);
  const [cplPageSize, setCplPageSize] = useState(10);

  const breadcrumbs = useMemo(() => [
    { label: 'Yudisium' }
  ], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Yudisium Mahasiswa');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const handleDownloadCertificate = async () => {
    try {
      const blob = await downloadStudentCertificate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Sertifikat-CPL-${data?.studentNim || 'Mahasiswa'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunduh sertifikat');
    }
  };

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
  const hasActiveYudisium = !!data?.yudisium;

  const currentStep = getActiveStepIndex(
    (data?.participantStatus as ParticipantStatus) ?? null,
    data?.allChecklistMet ?? false,
  );
  const isFinalized = currentStep >= 4;
  const statusBadge = displayStatus ? STATUS_BADGE_MAP[displayStatus] : STATUS_BADGE_MAP.draft;
  const participantStatusBadge = data?.participantStatus
    ? PARTICIPANT_STATUS_MAP[data.participantStatus] ?? null
    : null;

  const cplScores = data?.cplScores ?? [];
  const filteredCplScores = useMemo(() => {
    const term = cplSearch.trim().toLowerCase();
    if (!term) return cplScores;

    return cplScores.filter((score) =>
      (score.code ?? '').toLowerCase().includes(term) ||
      score.description.toLowerCase().includes(term) ||
      (score.validatedBy ?? score.verifiedBy ?? '').toLowerCase().includes(term)
    );
  }, [cplScores, cplSearch]);

  const paginatedCplScores = useMemo(() => {
    const start = (cplPage - 1) * cplPageSize;
    return filteredCplScores.slice(start, start + cplPageSize);
  }, [cplPage, cplPageSize, filteredCplScores]);

  const cplColumns = useMemo<Column<StudentCplScore>[]>(() => [
    {
      key: 'no',
      header: 'No',
      width: 60,
      className: 'text-center',
      render: (_row, index) => (
        <span className="text-sm text-muted-foreground">
          {(cplPage - 1) * cplPageSize + index + 1}
        </span>
      ),
    },
    {
      key: 'code',
      header: 'Kode CPL',
      width: 110,
      render: (row) => <span className="font-medium">{row.code ?? '-'}</span>,
    },
    {
      key: 'description',
      header: 'Deskripsi',
      className: 'min-w-[320px] whitespace-normal',
      render: (row) => (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {row.description}
        </p>
      ),
    },
    {
      key: 'score',
      header: 'Nilai',
      width: 80,
      className: 'text-center',
      render: (row) => <span className="font-semibold">{row.score ?? '-'}</span>,
    },
    {
      key: 'minimalScore',
      header: 'Minimal',
      width: 90,
      className: 'text-center',
      render: (row) => <span>{row.minimalScore}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: 130,
      className: 'text-center',
      render: (row) => (
        <Badge
          variant="outline"
          className={row.passed
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'}
        >
          {row.passed ? 'Lulus' : 'Belum Tercapai'}
        </Badge>
      ),
    },
    {
      key: 'verified',
      header: 'Diverifikasi',
      width: 220,
      render: (row) => {
        const validatorName = row.validatedBy ?? row.verifiedBy ?? null;
        const validatorNip = row.validatedByNip ?? row.verifiedByNip ?? null;
        const validatedAt = row.validatedAt ?? row.verifiedAt ?? null;

        if (!validatorName && row.status !== 'validated') {
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              <span>Belum diverifikasi</span>
            </div>
          );
        }

        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
              <span>{validatorName || 'Terverifikasi'}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {validatedAt ? formatDateTime(validatedAt) : '-'}
              {validatorNip ? ` • NIP ${validatorNip}` : ''}
            </div>
          </div>
        );
      },
    },
  ], [cplPage, cplPageSize]);

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
          <h1 className="text-2xl font-bold tracking-tight">Yudisium</h1>
          <p className="text-muted-foreground">
            Pantau status yudisium, checklist persyaratan, dan unggah dokumen persyaratan yudisium
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
        data?.yudisium && (
          <StudentYudisiumIdentityCard
            yudisium={data.yudisium}
            displayStatus={displayStatus!}
            statusBadge={statusBadge}
            participantStatusBadge={participantStatusBadge}
            decreeDocument={data.yudisium.decreeDocument}
            canDownloadCertificate={['appointed', 'finalized'].includes(data?.participantStatus || '')}
            onDownloadCertificate={handleDownloadCertificate}
          />
        )
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
          {data?.checklist && (
            <StudentYudisiumChecklistCard
              checklist={data.checklist}
              isYudisiumOpen={isRegistrationOpen}
              onExitSurveyClick={() => navigate('/yudisium/exit-survey')}
            />
          )}

          {/* Document Upload/Preview Card */}
          {(isRegistrationOpen || data?.participantStatus) ? (
            <YudisiumRequirementCard
              allChecklistMet={data?.allChecklistMet ?? false}
              participantStatus={data?.participantStatus as ParticipantStatus}
              isRegistrationOpen={isRegistrationOpen}
              fallbackRequirements={data?.requirements ?? []}
            />
          ) : (
            <RequirementsPreviewCard requirements={data?.requirements ?? []} />
          )}

        </div>
      </div>

      {(data?.cplScores.length ?? 0) > 0 && (
        <section className="space-y-[14px]">
          <CustomTable
            columns={cplColumns}
            data={paginatedCplScores}
            total={filteredCplScores.length}
            page={cplPage}
            pageSize={cplPageSize}
            onPageChange={setCplPage}
            onPageSizeChange={(size) => {
              setCplPageSize(size);
              setCplPage(1);
            }}
            searchValue={cplSearch}
            onSearchChange={(value) => {
              setCplSearch(value);
              setCplPage(1);
            }}
            emptyText="Tidak ada data CPL"
            rowKey={(row, index) => `${row.code ?? 'cpl'}-${index}`}
            className="rounded-[10px] border-gray-200 shadow-none"
          />
        </section>
      )}

      {/* Riwayat Percobaan — matching Thesis Defence layout */}
      {(data?.history?.length ?? 0) > 0 && (
        <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px]">
          {/* Card header */}
          <div className="flex items-center justify-between mb-[14px]">
            <div className="text-base font-semibold text-foreground">Riwayat Percobaan</div>
            <span className="text-xs text-muted-foreground font-medium">
              {(data?.history?.length ?? 0)} pendaftaran sebelumnya
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
            {(data?.history ?? []).map((item: any, idx: number) => (
              <StudentYudisiumHistoryCard
                key={item.id}
                index={idx + 1}
                item={item}
                onOpen={() =>
                  navigate(`/yudisium/${item.yudisiumId}/peserta/${item.id}?from=student`, {
                    state: { from: 'student-yudisium' },
                  })
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
