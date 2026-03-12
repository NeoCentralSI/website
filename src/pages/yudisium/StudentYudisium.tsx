import { useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Lottie from 'lottie-react';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/spinner';
import { CheckCircle2, Circle, Clock, CalendarRange, BookOpenText, Download, PartyPopper } from 'lucide-react';
import { useStudentYudisiumOverview } from '@/hooks/yudisium/useStudentYudisium';
import type { StudentYudisiumChecklistItem } from '@/types/studentYudisium.types';
import { UploadDokumenYudisium } from '@/components/yudisium/UploadDokumenYudisium';
import emptyAnimation from '@/assets/lottie/empty.json';
import { formatDateOnlyId } from '@/lib/text';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';

const formatDateTime = (date: string | null | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatDateOnly = (date: string | null | undefined) => {
  if (!date) return '-';
  return formatDateOnlyId(date);
};

const checklistEntries = (checklist: Record<string, StudentYudisiumChecklistItem>) =>
  Object.entries(checklist).map(([key, value]) => ({ key, ...value }));

type YudisiumStatus = 'draft' | 'open' | 'closed' | 'under_review' | 'in_review' | 'finalized';
type ParticipantStatus = 'registered' | 'under_review' | 'approved' | 'rejected' | 'finalized' | null;

const STEPS = [
  { key: 'checklist', label: 'Checklist Persyaratan' },
  { key: 'documents', label: 'Dokumen Yudisium Lengkap' },
  { key: 'cpl', label: 'Nilai CPL Tervalidasi' },
  { key: 'schedule', label: 'Penetapan Jadwal Yudisium' },
  { key: 'yudisium', label: 'Pelaksanaan Yudisium' },
] as const;

const STATUS_BADGE_MAP: Record<YudisiumStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100',
  },
  open: {
    label: 'Pendaftaran Dibuka',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  },
  closed: {
    label: 'Pendaftaran Ditutup',
    className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
  },
  in_review: {
    label: 'Dalam Review',
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
  },
  under_review: {
    label: 'Dalam Review',
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
  },
  finalized: {
    label: 'Final',
    className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100',
  },
};

function getActiveStepIndex(
  status: YudisiumStatus,
  participantStatus: ParticipantStatus,
  allChecklistMet: boolean,
  allDocumentsUploaded: boolean,
  allCplVerified: boolean,
  hasDecree: boolean,
  eventDate: string | null,
): number {
  // Finalized = everything complete (all steps green)
  if (status === 'finalized' || participantStatus === 'finalized') return 5;

  if (!allChecklistMet) return 0;

  const isPastDocumentValidation = ['under_review', 'approved', 'finalized'].includes(participantStatus ?? 'registered');
  const documentsCompleted = allDocumentsUploaded || isPastDocumentValidation;
  if (!documentsCompleted) return 1;

  // CPL step
  if (!allCplVerified) return 2;

  // Decree/schedule step
  if (!hasDecree) return 3;

  // Check if event date has passed or is today
  if (eventDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const event = new Date(eventDate);
    event.setHours(0, 0, 0, 0);
    if (today >= event) return 4; // On or past event date
  }

  // Decree exists but event not yet
  return 4;
}

function YudisiumStatusStepper({ currentStep, isFinalized }: { currentStep: number; isFinalized: boolean }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Status Yudisium</h3>
        {isFinalized && (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <PartyPopper className="mr-1 h-3 w-3" />
            Selesai
          </Badge>
        )}
      </div>
      <div className="flex items-center">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const completedColor = isFinalized ? 'bg-emerald-500 border-emerald-500' : 'border-primary bg-primary';
          const completedLineColor = isFinalized ? 'bg-emerald-500' : 'bg-primary';

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div
                  className={`h-0.5 flex-1 ${
                    index === 0 ? 'bg-transparent' : isCompleted ? completedLineColor : 'bg-muted'
                  }`}
                />
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isCurrent
                      ? 'border-primary bg-primary/10 text-primary'
                      : isCompleted
                        ? `${completedColor} text-primary-foreground`
                        : 'border-muted bg-muted/30 text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </div>
                <div
                  className={`h-0.5 flex-1 ${
                    index === STEPS.length - 1 ? 'bg-transparent' : isCompleted ? completedLineColor : 'bg-muted'
                  }`}
                />
              </div>
              <span
                className={`mt-2 max-w-[100px] text-center text-xs ${
                  isCompleted || isCurrent
                    ? isFinalized ? 'text-emerald-600 font-medium' : 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChecklistItem({
  item,
  onExitSurveyClick,
}: {
  item: StudentYudisiumChecklistItem & { key: string };
  onExitSurveyClick: () => void;
}) {
  const isCompleted = item.met;
  const isExitSurvey = item.key === 'exitSurvey';
  const isRevision = item.key === 'revisiSidang';
  const progressText =
    typeof item.current === 'number' && typeof item.required === 'number'
      ? `Progress SKS: ${item.current}/${item.required}`
      : null;

  return (
    <div className={`rounded-lg border p-4 ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-muted/30 border-muted'}`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isCompleted ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
          }`}
        >
          {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{item.label}</p>
          {progressText && <p className="mt-1 text-xs text-muted-foreground">{progressText}</p>}
          {item.submittedAt && <p className="mt-1 text-xs text-muted-foreground">Dikirim: {formatDateTime(item.submittedAt)}</p>}
          {isRevision && item.revisionFinalizedAt && (
            <p className="mt-1 text-xs text-muted-foreground">Revisi disahkan: {formatDateTime(item.revisionFinalizedAt)}</p>
          )}
          <p className={`mt-1 text-xs ${isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
            {isCompleted ? 'Terpenuhi' : 'Menunggu'}
          </p>
        </div>

        {isExitSurvey && (
          <Button size="sm" variant={isCompleted ? 'outline' : 'default'} onClick={onExitSurveyClick}>
            {isCompleted ? 'Lihat Exit Survey' : 'Isi Exit Survey'}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function StudentYudisium() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch, isFetching } = useStudentYudisiumOverview();

  const breadcrumbs = useMemo(() => [{ label: 'Yudisium' }], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const checklistItems = data ? checklistEntries(data.checklist) : [];
  const allDocumentsUploaded = (data?.requirements ?? []).every((item) => item.isUploaded);
  const hasDecree = !!(data?.yudisium?.decreeDocument);
  const currentStep = data?.yudisium
    ? getActiveStepIndex(
      data.yudisium.status as YudisiumStatus,
      data.participantStatus ?? null,
      data.allChecklistMet,
      allDocumentsUploaded,
      data.allCplVerified,
      hasDecree,
      data.yudisium.eventDate,
    )
    : 0;
  const isFinalized = currentStep >= 5;

  const statusBadge = data?.yudisium
    ? STATUS_BADGE_MAP[data.yudisium.status as YudisiumStatus] || STATUS_BADGE_MAP.draft
    : STATUS_BADGE_MAP.draft;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Yudisium Mahasiswa</h1>
        <p className="text-muted-foreground">Pantau kesiapan checklist yudisium dan dokumen persyaratan Anda.</p>
      </div>

      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data yudisium..." />
        </div>
      ) : isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Gagal Memuat Data Yudisium</CardTitle>
            <CardDescription>
              Permintaan ke server gagal. Ini berbeda dengan kondisi tidak ada periode yudisium.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.'}</p>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              Coba Muat Ulang
            </Button>
          </CardContent>
        </Card>
      ) : !data?.yudisium ? (
        <Card>
          <CardContent className="py-8">
            <div className="mx-auto flex max-w-xl flex-col items-center text-center">
              <Lottie animationData={emptyAnimation} loop className="h-64 w-64" />
              <h2 className="text-xl font-semibold">Belum Ada Periode Yudisium yang Berlangsung</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Saat ini belum ada periode yudisium berstatus terbuka. Silakan cek kembali saat periode sudah dibuka.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <YudisiumStatusStepper currentStep={currentStep} isFinalized={isFinalized} />

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Informasi Yudisium</CardTitle>
                <Badge variant="outline" className={statusBadge.className}>{statusBadge.label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex gap-2.5">
                  <BookOpenText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">Periode Yudisium</p>
                    <p className="text-sm font-medium">{data.yudisium.name ?? 'Periode Yudisium Berjalan'}</p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <CalendarRange className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">Rentang Pendaftaran</p>
                    <p className="text-sm font-medium">
                      {formatDateOnly(data.yudisium.registrationOpenDate)} - {formatDateOnly(data.yudisium.registrationCloseDate)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-gray-200 bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">Checklist Persyaratan</h3>
              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <ChecklistItem
                    key={item.key}
                    item={item}
                    onExitSurveyClick={() => navigate('/yudisium/student/exit-survey')}
                  />
                ))}
              </div>
            </div>

            <UploadDokumenYudisium allChecklistMet={data.allChecklistMet} />
          </div>

          {/* CPL Scores Section */}
          {data.cplScores.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Validasi Capaian Pembelajaran Lulusan</CardTitle>
                  {data.allCplVerified && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Semua CPL Tervalidasi
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {data.allCplVerified && (
                  <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-sm font-medium text-emerald-700">
                      Selamat! Anda telah menjadi <strong>Calon Peserta Yudisium</strong>.
                    </p>
                  </div>
                )}
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr className="border-b">
                        <th className="px-3 py-2 text-left">Kode CPL</th>
                        <th className="px-3 py-2 text-left">Deskripsi</th>
                        <th className="px-3 py-2 text-left">Nilai</th>
                        <th className="px-3 py-2 text-left">Skor Minimal</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cplScores.map((cpl, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-3 py-2">{cpl.code ?? '-'}</td>
                          <td className="px-3 py-2">{cpl.description}</td>
                          <td className="px-3 py-2">{cpl.score ?? '-'}</td>
                          <td className="px-3 py-2">{cpl.minimalScore}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className={
                              cpl.status === 'verified'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : cpl.passed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                            }>
                              {cpl.status === 'verified' ? 'Tervalidasi' : cpl.passed ? 'Lulus' : 'Tidak Lulus'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Decree / SK Section */}
          {hasDecree && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Surat Keputusan Yudisium</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nomor SK</p>
                    <p className="font-medium">{data.yudisium.decreeNumber ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tanggal Ditetapkan</p>
                    <p className="font-medium">{formatDateOnly(data.yudisium.decreeIssuedAt)}</p>
                  </div>
                  {data.yudisium.eventDate && (
                    <div>
                      <p className="text-muted-foreground">Tanggal Yudisium</p>
                      <p className="font-medium">{formatDateOnly(data.yudisium.eventDate)}</p>
                    </div>
                  )}
                </div>
                {data.yudisium.decreeDocument?.filePath && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await openProtectedFile(
                          data.yudisium!.decreeDocument!.filePath!,
                          data.yudisium!.decreeDocument!.fileName ?? 'SK-Yudisium.pdf'
                        );
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Gagal mengunduh SK');
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Unduh SK Yudisium
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
