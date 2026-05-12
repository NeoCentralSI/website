import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading, Spinner } from '@/components/ui/spinner';
import { useSeminarAnnouncements, useRegisterToSeminar, useCancelSeminarRegistration } from '@/hooks/thesis-seminar';
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
  Clock,
  MapPin,
  Search,
  UserCheck,
  XCircle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { toTitleCaseName, formatRoleName, formatDateShortId, formatDateOnlyId } from '@/lib/text';
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

const PAGE_SIZE = 5;

interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}

type PaginationItem = number | 'ellipsis';

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PaginationItem[] = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);

  if (left > 2) {
    items.push('ellipsis');
  }

  for (let page = left; page <= right; page += 1) {
    items.push(page);
  }

  if (right < totalPages - 1) {
    items.push('ellipsis');
  }

  items.push(totalPages);
  return items;
}

const STATUS_CONFIG: Record<ThesisSeminarStatus, StatusConfig> = {
  scheduled: {
    label: 'Dijadwalkan',
    variant: 'default',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  },
  ongoing: {
    label: 'Sedang Berlangsung',
    variant: 'default',
    className: 'bg-orange-100 text-orange-700 hover:bg-orange-100 animate-pulse',
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
  const navigate = useNavigate();
  const isFinalizedResult = ['passed', 'passed_with_revision', 'failed'].includes(seminar.status);

  const pembimbing1 = seminar.supervisors.find((s) => s.role === 'Pembimbing 1');
  const isUpcoming = seminar.status === 'scheduled' && !seminar.isPast;
  const openDetail = () => navigate(`/tugas-akhir/seminar-hasil/${seminar.id}`, {
    state: { fromAnnouncement: 'seminar-hasil' },
  });
  const audienceState = seminar.isRegistered
    ? seminar.isPresent
      ? {
        label: 'Hadir',
        className: 'bg-green-100 text-green-700',
        icon: CheckCircle2,
      }
      : isFinalizedResult
        ? {
          label: 'Tidak Hadir',
          className: 'bg-rose-100 text-rose-700',
          icon: XCircle,
        }
        : {
          label: 'Terdaftar',
          className: 'bg-amber-50 text-amber-700',
          icon: UserCheck,
        }
    : {
      label: seminar.isPast ? 'Selesai' : 'Belum daftar',
      className: 'bg-muted/60 text-muted-foreground',
      icon: seminar.isPast ? CheckCircle2 : UserCheck,
    }
  const AudienceStateIcon = audienceState.icon

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetail();
        }
      }}
      className={cn(
        'flex flex-col sm:flex-row gap-0 border-b last:border-b-0 transition-colors hover:bg-muted/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isUpcoming && 'hover:bg-blue-50/40'
      )}
    >
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
            <span className={!seminar.startTime || !seminar.endTime ? 'text-[11px] leading-tight' : ''}>
              {!seminar.startTime || !seminar.endTime 
                ? formatDateShortId(seminar.date)
                : `${startTime} – ${endTime}`}
            </span>
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
            <Badge
              variant={statusCfg.variant}
              className={cn('text-xs whitespace-nowrap', statusCfg.className)}
            >
              {statusCfg.label}
            </Badge>
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
        <div className="flex flex-col items-end justify-between gap-2 shrink-0 self-stretch sm:min-w-[120px]">
          {!(seminar.isOwn && !seminar.isPast && !seminar.isRegistered) && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
              audienceState.className
            )}>
              <AudienceStateIcon className="h-3 w-3" />
              {audienceState.label}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col items-end gap-2 mt-auto">
            {!seminar.isOwn && seminar.status === 'scheduled' && (
              <>
                {!seminar.isPast && !seminar.isRegistered && (
                  <Button
                    size="sm"
                    variant="default"
                    className="text-xs h-7 px-3"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRegister(seminar);
                    }}
                    disabled={isRegistering}
                  >
                    {isRegistering ? (
                      <><Spinner className="h-3 w-3 mr-1" /> Mendaftar...</>
                    ) : (
                      'Daftar'
                    )}
                  </Button>
                )}
                {!seminar.isPast && seminar.isRegistered && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                    onClick={(event) => {
                      event.stopPropagation();
                      onCancel(seminar);
                    }}
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
                  <span className="text-xs text-muted-foreground/60 italic">Selesai</span>
                )}
              </>
            )}
          </div>
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
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState<SeminarAnnouncementItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SeminarAnnouncementItem | null>(null);

  // Filtered, sorted, and paginated data
  const filtered = useMemo(() => {
    if (!seminars) return [];
    const q = search.toLowerCase().trim();
    return seminars.filter((s) => {
      const matchSearch =
        !q ||
        s.presenterName.toLowerCase().includes(q) ||
        s.thesisTitle.toLowerCase().includes(q) ||
        s.supervisors.some((sv: { name: string }) => sv.name.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [seminars, search]);

  const sortedSeminars = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aDate = new Date(`${a.date}T${a.startTime}`).getTime();
      const bDate = new Date(`${b.date}T${b.startTime}`).getTime();
      return bDate - aDate;
    });
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(sortedSeminars.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedSeminars = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedSeminars.slice(start, start + PAGE_SIZE);
  }, [currentPage, sortedSeminars]);

  const grouped = useMemo(() => {
    const map = new Map<string, SeminarAnnouncementItem[]>();
    for (const s of paginatedSeminars) {
      const key = getLocalDateKey(s.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [paginatedSeminars]);

  // Loading state
  if (isLoading && !seminars) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center p-6">
        <Loading size="lg" text="Memuat pengumuman seminar..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Pengumuman Seminar Hasil</h1>
        <p className="text-muted-foreground">
          Jadwal seminar hasil mahasiswa yang telah ditetapkan
        </p>
      </div>

      {/* Search + pagination bar */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:flex-1 sm:max-w-[65%]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama mahasiswa atau judul TA..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </Button>
            {getPaginationItems(currentPage, totalPages).map((item, index) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  size="sm"
                  variant={currentPage === item ? 'default' : 'outline'}
                  className="h-8 min-w-8 px-2 text-xs"
                  onClick={() => setCurrentPage(item)}
                >
                  {item}
                </Button>
              )
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Menampilkan {sortedSeminars.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedSeminars.length)} dari {sortedSeminars.length} seminar
        </span>
        <span>Halaman {currentPage} dari {totalPages}</span>
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
              <div>
                <AlertDialogTitle className="text-base">Daftar Seminar</AlertDialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Konfirmasi pendaftaran Anda</p>
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
                'Ya, Daftar'
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
                      <p className="text-sm tabular-nums">
                        {!cancelTarget.startTime || !cancelTarget.endTime
                          ? formatDateOnlyId(cancelTarget.date)
                          : `${extractTimeUTC(cancelTarget.startTime)} – ${extractTimeUTC(cancelTarget.endTime)} WIB`}
                      </p>
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
