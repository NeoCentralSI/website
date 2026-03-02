import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading, Spinner } from '@/components/ui/spinner';
import { useSeminarAnnouncements, useRegisterToSeminar, useCancelSeminarRegistration } from '@/hooks/seminar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CalendarDays,
  CalendarCheck,
  Clock,
  MapPin,
  Search,
  Megaphone,
  UserCheck,
  XCircle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { toTitleCaseName, formatRoleName } from '@/lib/text';
import { cn } from '@/lib/utils';
import type { SeminarAnnouncementItem, ThesisSeminarStatus } from '@/types/seminar.types';

// ─── helpers ────────────────────────────────────────────────

function extractTimeUTC(iso: string | null | undefined): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatDateHeader(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function getLocalDateKey(iso: string | null | undefined): string {
  if (!iso) return 'unknown';
  const d = new Date(iso);
  const offsetMs = 7 * 60 * 60 * 1000;
  const local = new Date(d.getTime() + offsetMs);
  return local.toISOString().slice(0, 10);
}

type StatusFilter = 'all' | 'upcoming' | 'past';

interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}

const STATUS_CONFIG: Record<ThesisSeminarStatus, StatusConfig> = {
  scheduled: {
    label: 'Dijadwalkan',
    variant: 'default',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  },
  registered: {
    label: 'Terdaftar',
    variant: 'secondary',
    className: '',
  },
  verified: {
    label: 'Terverifikasi',
    variant: 'secondary',
    className: '',
  },
  examiner_assigned: {
    label: 'Penguji Ditetapkan',
    variant: 'secondary',
    className: '',
  },
  passed: {
    label: 'Lulus',
    variant: 'default',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  passed_with_revision: {
    label: 'Lulus dgn Revisi',
    variant: 'default',
    className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  },
  failed: {
    label: 'Tidak Lulus',
    variant: 'destructive',
    className: '',
  },
  cancelled: {
    label: 'Dibatalkan',
    variant: 'outline',
    className: 'text-muted-foreground',
  },
};

// ─── sub-component: seminar card ────────────────────────────

interface SeminarCardProps {
  seminar: SeminarAnnouncementItem;
  onRegister: (seminar: SeminarAnnouncementItem) => void;
  onCancel: (seminar: SeminarAnnouncementItem) => void;
  isRegistering: boolean;
  isCancelling: boolean;
}

function SeminarCard({ seminar, onRegister, onCancel, isRegistering, isCancelling }: SeminarCardProps) {
  const statusCfg = STATUS_CONFIG[seminar.status] ?? STATUS_CONFIG.scheduled;
  const startTime = extractTimeUTC(seminar.startTime);
  const endTime = extractTimeUTC(seminar.endTime);

  const pembimbing1 = seminar.supervisors.find((s) => s.role === 'Pembimbing 1');
  const isUpcoming = seminar.status === 'scheduled' && !seminar.isPast;

  return (
    <div className={cn(
      'flex flex-col sm:flex-row gap-0 border-b last:border-b-0 transition-colors hover:bg-muted/20',
      isUpcoming && 'hover:bg-blue-50/40'
    )}>
      {/* Left accent bar */}
      <div className={cn(
        'w-1 shrink-0 rounded-none',
        isUpcoming ? 'bg-primary' : seminar.isPast ? 'bg-muted' : 'bg-green-400'
      )} />

      <div className="flex flex-1 flex-col sm:flex-row gap-4 p-4">
        {/* Time + Room column */}
        <div className="flex sm:flex-col gap-3 sm:gap-1.5 sm:w-32 shrink-0 sm:pt-0.5">
          <div className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{startTime} – {endTime}</span>
          </div>
          {seminar.room && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{seminar.room.name}</span>
            </div>
          )}
        </div>

        {/* Info column */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm leading-tight">{toTitleCaseName(seminar.presenterName)}</span>
            {seminar.isOwn && (
              <Badge variant="outline" className="text-xs border-primary text-primary shrink-0 py-0">
                Seminar Anda
              </Badge>
            )}
          </div>
          <div className="flex items-start gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-muted-foreground text-xs line-clamp-2 leading-snug">{seminar.thesisTitle}</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
            {pembimbing1 && (
              <span>
                <span className="font-medium text-foreground/60">Pembimbing:</span>{' '}
                {toTitleCaseName(pembimbing1.name)}
              </span>
            )}
            {seminar.examiners.map((e) => (
              <span key={e.order}>
                <span className="font-medium text-foreground/60">{formatRoleName(`penguji${e.order}`)}:</span>{' '}
                {toTitleCaseName(e.name)}
              </span>
            ))}
          </div>
        </div>

        {/* Status + Action column */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 sm:min-w-[120px]">
          <Badge
            variant={statusCfg.variant}
            className={cn('text-xs whitespace-nowrap', statusCfg.className)}
          >
            {statusCfg.label}
          </Badge>

          {/* Audience registration state */}
          {seminar.isRegistered && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
              seminar.isPresent
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-50 text-amber-700'
            )}>
              {seminar.isPresent ? (
                <><CheckCircle2 className="h-3 w-3" /> Hadir</>
              ) : (
                <><UserCheck className="h-3 w-3" /> Terdaftar</>
              )}
            </div>
          )}

          {/* Action buttons */}
          {!seminar.isOwn && seminar.status === 'scheduled' && (
            <>
              {!seminar.isPast && !seminar.isRegistered && (
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs h-7 px-3"
                  onClick={() => onRegister(seminar)}
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <><Spinner className="h-3 w-3 mr-1" /> Mendaftar...</>
                  ) : (
                    'Daftar Hadir'
                  )}
                </Button>
              )}
              {!seminar.isPast && seminar.isRegistered && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => onCancel(seminar)}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <><Spinner className="h-3 w-3 mr-1" /> Membatalkan...</>
                  ) : (
                    <><XCircle className="h-3.5 w-3.5 mr-1" /> Batalkan</>
                  )}
                </Button>
              )}
              {seminar.isPast && !seminar.isRegistered && (
                <span className="text-xs text-muted-foreground/60 italic">Terlewat</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── main page ──────────────────────────────────────────────

export default function SeminarHasilAnnouncement() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const breadcrumbs = useMemo(
    () => [
      { label: 'Pengumuman' },
      { label: 'Seminar Hasil' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const { data: seminars, isLoading } = useSeminarAnnouncements();
  const { mutate: register, isPending: isRegistering } = useRegisterToSeminar();
  const { mutate: cancelReg, isPending: isCancelling } = useCancelSeminarRegistration();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [confirmTarget, setConfirmTarget] = useState<SeminarAnnouncementItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SeminarAnnouncementItem | null>(null);

  // Filtered and grouped data
  const filtered = useMemo(() => {
    if (!seminars) return [];
    const q = search.toLowerCase().trim();
    return seminars.filter((s) => {
      const matchSearch =
        !q ||
        s.presenterName.toLowerCase().includes(q) ||
        s.thesisTitle.toLowerCase().includes(q) ||
        s.supervisors.some((sv) => sv.name.toLowerCase().includes(q));
      const matchFilter =
        statusFilter === 'all'
          ? true
          : statusFilter === 'upcoming'
          ? !s.isPast
          : s.isPast;
      return matchSearch && matchFilter;
    });
  }, [seminars, search, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, SeminarAnnouncementItem[]>();
    for (const s of filtered) {
      const key = getLocalDateKey(s.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const counts = useMemo(() => {
    if (!seminars) return { all: 0, upcoming: 0, past: 0 };
    return {
      all: seminars.length,
      upcoming: seminars.filter((s) => !s.isPast).length,
      past: seminars.filter((s) => s.isPast).length,
    };
  }, [seminars]);

  // Loading state
  if (isLoading && !seminars) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat pengumuman seminar..." />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0 mt-0.5">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Pengumuman Seminar Hasil</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Jadwal seminar hasil mahasiswa yang telah ditetapkan. Daftar hadir untuk memenuhi syarat kehadiran seminar.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama mahasiswa atau judul TA..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'upcoming', 'past'] as StatusFilter[]).map((f) => {
            const labels: Record<StatusFilter, string> = {
              all: `Semua (${counts.all})`,
              upcoming: `Akan Datang (${counts.upcoming})`,
              past: `Telah Berlalu (${counts.past})`,
            };
            return (
              <Button
                key={f}
                size="sm"
                variant={statusFilter === f ? 'default' : 'outline'}
                onClick={() => setStatusFilter(f)}
                className="text-xs"
              >
                {labels[f]}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Seminar list */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <CalendarDays className="h-12 w-12 opacity-30" />
          <p className="text-sm">
            {search ? 'Tidak ditemukan seminar yang sesuai pencarian.' : 'Belum ada pengumuman seminar hasil.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([dateKey, items]) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground capitalize">
                  {formatDateHeader(items[0].date)}
                </h3>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {items.length} seminar
                </span>
              </div>
              <Card className="overflow-hidden py-0">
                <CardContent className="p-0">
                  {items.map((seminar) => (
                    <SeminarCard
                      key={seminar.id}
                      seminar={seminar}
                      onRegister={setConfirmTarget}
                      onCancel={setCancelTarget}
                      isRegistering={isRegistering}
                      isCancelling={isCancelling}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Confirm register dialog */}
      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                <CalendarCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <AlertDialogTitle className="text-base">Daftar Hadir Seminar</AlertDialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Konfirmasi pendaftaran kehadiran Anda</p>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3.5 space-y-2.5">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Presenter</p>
                  <p className="font-semibold text-sm">{toTitleCaseName(confirmTarget?.presenterName)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Judul TA</p>
                  <p className="text-sm text-foreground/80 line-clamp-2">{confirmTarget?.thesisTitle}</p>
                </div>
                {confirmTarget && (
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Tanggal</p>
                      <p className="text-sm">{formatDateHeader(confirmTarget.date)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Waktu</p>
                      <p className="text-sm tabular-nums">{extractTimeUTC(confirmTarget.startTime)} – {extractTimeUTC(confirmTarget.endTime)}</p>
                    </div>
                    {confirmTarget.room && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Ruangan</p>
                        <p className="text-sm">{confirmTarget.room.name}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ⓘ Kehadiran Anda akan tercatat setelah dikonfirmasi oleh dosen pembimbing mahasiswa yang bersangkutan.
              </p>
            </div>
          </AlertDialogDescription>
          <AlertDialogFooter className="mt-1">
            <AlertDialogCancel className="text-sm">Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRegistering}
              onClick={() => {
                if (confirmTarget) {
                  register(confirmTarget.id);
                  setConfirmTarget(null);
                }
              }}
            >
              {isRegistering ? (
                <><Spinner className="h-4 w-4 mr-2" /> Mendaftar...</>
              ) : (
                'Ya, Daftar Hadir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm cancel dialog */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <AlertDialogTitle className="text-base">Batalkan Pendaftaran?</AlertDialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Anda dapat mendaftar ulang selama seminar belum berlangsung</p>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3.5 space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Presenter</p>
                  <p className="font-semibold text-sm">{toTitleCaseName(cancelTarget?.presenterName)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Judul TA</p>
                  <p className="text-sm text-foreground/80 line-clamp-2">{cancelTarget?.thesisTitle}</p>
                </div>
                {cancelTarget && (
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Tanggal</p>
                      <p className="text-sm">{formatDateHeader(cancelTarget.date)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Waktu</p>
                      <p className="text-sm tabular-nums">{extractTimeUTC(cancelTarget.startTime)} – {extractTimeUTC(cancelTarget.endTime)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AlertDialogDescription>
          <AlertDialogFooter className="mt-1">
            <AlertDialogCancel className="text-sm">Tidak, Tetap Hadir</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isCancelling}
              onClick={() => {
                if (cancelTarget) {
                  cancelReg(cancelTarget.id);
                  setCancelTarget(null);
                }
              }}
            >
              {isCancelling ? (
                <><Spinner className="h-4 w-4 mr-2" /> Membatalkan...</>
              ) : (
                'Ya, Batalkan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
