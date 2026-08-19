import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, MapPin, Download, Info } from 'lucide-react';
import { formatDateOnlyId } from '@/lib/text';
import { openProtectedFile } from '@/lib/protected-file';
import { downloadStudentCertificate } from '@/services/yudisium/student.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { StudentYudisiumOverviewResponse } from '@/types/student-yudisium.types';

type YudisiumDisplayStatus = 'draft' | 'open' | 'closed' | 'ongoing' | 'completed';

const STATUS_BADGE_MAP: Record<YudisiumDisplayStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  open: { label: 'Pendaftaran Dibuka', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  closed: { label: 'Pendaftaran Ditutup', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  ongoing: { label: 'Sedang Berlangsung', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  completed: { label: 'Selesai', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const PARTICIPANT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  registered: { label: 'Terdaftar (Proses Verifikasi)', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  eligible: { label: 'Eligibel', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  appointed: { label: 'Peserta Yudisium (Ditetapkan)', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  finalized: { label: 'Lulus Yudisium', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Tidak Memenuhi Persyaratan', className: 'bg-red-50 text-red-700 border-red-200' },
};

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

interface StudentYudisiumIdentityCardProps {
  overview: StudentYudisiumOverviewResponse;
}

export function StudentYudisiumIdentityCard({ overview }: StudentYudisiumIdentityCardProps) {
  const yudisium = overview.yudisium;
  if (!yudisium) return null;

  const displayStatus = deriveDisplayStatus(
    yudisium.status,
    yudisium.registrationOpenDate ?? null,
    yudisium.registrationCloseDate ?? null,
    yudisium.eventDate ?? null,
  );

  const statusBadge = STATUS_BADGE_MAP[displayStatus] || STATUS_BADGE_MAP.draft;
  const participantStatusBadge = overview.participantStatus
    ? PARTICIPANT_STATUS_MAP[overview.participantStatus] ?? null
    : null;

  const decreeDocument = yudisium.decreeDocument;
  const canDownloadCertificate = ['appointed', 'finalized'].includes(overview.participantStatus || '');

  const handleDownloadCert = async () => {
    try {
      const blob = await downloadStudentCertificate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Sertifikat-CPL-${overview.studentNim || 'Mahasiswa'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunduh sertifikat');
    }
  };

  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px] transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-[14px]">
        <div className="text-base font-semibold text-foreground">Informasi Yudisium</div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", statusBadge.className)}>
            {statusBadge.label}
          </Badge>
          {participantStatusBadge && (
            <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", participantStatusBadge.className)}>
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
            Periode Yudisium
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
            {formatDateOnlyId(yudisium.registrationOpenDate)} – {formatDateOnlyId(yudisium.registrationCloseDate)}
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Calendar size={12} className="opacity-50" />
            Tanggal Pelaksanaan
          </div>
          <div className="text-sm text-foreground font-medium">
            {formatDateOnlyId(yudisium.eventDate)}
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

      {/* Downloads Action Bar */}
      {(decreeDocument?.filePath || canDownloadCertificate) && (
        <div className="mt-4 pt-3 border-t border-gray-200/70 flex flex-wrap items-center gap-2">
          {decreeDocument?.filePath && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-gray-200 bg-card text-primary hover:bg-primary/5 text-xs font-medium shrink-0 shadow-none transition-colors"
              onClick={async () => {
                const filePath = decreeDocument.filePath;
                if (!filePath) return;
                try {
                  await openProtectedFile(filePath, decreeDocument.fileName || 'SK-Yudisium.pdf');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Gagal mengunduh SK');
                }
              }}
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              Unduh SK Yudisium
            </Button>
          )}
          {canDownloadCertificate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-gray-200 bg-card text-primary hover:bg-primary/5 text-xs font-medium shrink-0 shadow-none transition-colors"
              onClick={handleDownloadCert}
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              Unduh Sertifikat CPL
            </Button>
          )}
        </div>
      )}

      {/* Status Alerts */}
      {displayStatus === 'draft' && (
        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground p-[8px_12px] bg-muted border border-gray-200 rounded-[7px]">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>Periode yudisium ini belum dibuka untuk pendaftaran. Upload dokumen akan diaktifkan saat pendaftaran dibuka.</span>
        </div>
      )}
      {displayStatus === 'closed' && (
        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground p-[8px_12px] bg-muted border border-gray-200 rounded-[7px]">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>Pendaftaran sudah ditutup. Jika Anda belum terdaftar, silakan hubungi Koordinator Yudisium.</span>
        </div>
      )}
    </div>
  );
}
