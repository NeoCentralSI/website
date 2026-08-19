import { useEffect, useState, useMemo, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useLocation, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading, Spinner } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import {
  ArrowLeft, FileText, CheckCircle,
  Eye,
  Check, Plus, CheckCircle2,
  Download,
  Upload,
  X,
  User,
  BarChart3,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  useYudisiumParticipantDetail,
  useParticipantCplScores,
  useValidateCplScore,
  useRepairCplScore,
} from '@/hooks/yudisium/useYudisiumParticipants';
import { useRole } from '@/hooks/shared';
import { openProtectedFile } from '@/lib/protected-file';
import { formatDateId, formatDateShortId, formatDateTimeId, formatRoleName, toTitleCaseName, truncateFileName } from '@/lib/text';
import { exportParticipantCplReport } from '@/services/yudisium/participant.service';
import type { CplScoreItem } from '@/types/admin-yudisium.types';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const PARTICIPANT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  registered: { label: 'Terdaftar (Proses Verifikasi)', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  eligible: { label: 'Eligibel', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  appointed: { label: 'Peserta Yudisium (Ditetapkan)', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  finalized: { label: 'Lulus Yudisium', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Ditolak', className: 'bg-red-50 text-red-700 border-red-200' },
};



export default function YudisiumParticipantDetail() {
  const { id: yudisiumId, yudisiumParticipantId } = useParams<{ id: string; yudisiumParticipantId: string }>();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isGkm, isStudent } = useRole();
  const canPerformActions = isGkm();
  const isStudentMode =
    isStudent() &&
    (searchParams.get('from') === 'student' || (location.state as { from?: string } | null)?.from === 'student-yudisium');

  const { data, isLoading } = useYudisiumParticipantDetail(yudisiumId || '', yudisiumParticipantId || '');
  const { data: cplData, isLoading: loadingCpl, isFetching, refetch } = useParticipantCplScores(yudisiumId || '', yudisiumParticipantId || '');

  const validateMutation = useValidateCplScore(yudisiumId || '', yudisiumParticipantId || '');
  const repairMutation = useRepairCplScore(yudisiumId || '', yudisiumParticipantId || '');

  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCpl, setSelectedCpl] = useState<CplScoreItem | null>(null);

  const [newScore, setNewScore] = useState<number>(0);
  const [recFile, setRecFile] = useState<File | null>(null);
  const [setFile, setSetFile] = useState<File | null>(null);
  const recFileInputRef = useRef<HTMLInputElement>(null);
  const setFileInputRef = useRef<HTMLInputElement>(null);

  const [verifyConfirmId, setVerifyConfirmId] = useState<string | null>(null);
  const [cplSearch, setCplSearch] = useState('');

  const handleDownloadCplReport = async () => {
    if (!yudisiumId || !yudisiumParticipantId) return;
    try {
      const blob = await exportParticipantCplReport(yudisiumId, yudisiumParticipantId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan-CPL-${data?.studentNim || 'Mahasiswa'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunduh laporan CPL');
    }
  };

  const baseDetailPath = `/yudisium/${yudisiumId}`;
  const backPath = isStudentMode ? '/yudisium' : baseDetailPath;

  useEffect(() => {
    if (isStudentMode) {
      setBreadcrumbs([
        { label: 'Yudisium', href: '/yudisium' },
        { label: data?.yudisium?.name ?? 'Detail Peserta' },
      ]);
      setTitle(data?.yudisium?.name ?? 'Detail Peserta Yudisium');
      return;
    }

    setBreadcrumbs([
      { label: 'Yudisium', href: '/yudisium' },
      { label: data?.yudisium?.name ?? 'Detail', href: baseDetailPath },
      { label: data?.studentName ?? 'Detail Peserta' },
    ]);
    setTitle(data?.studentName ?? 'Detail Peserta');
  }, [setBreadcrumbs, setTitle, data, baseDetailPath, isStudentMode]);

  const cplScores = useMemo(() => {
    const scores = cplData?.cplScores ?? [];
    if (!cplSearch) return scores;
    return scores.filter(s =>
      (s.code?.toLowerCase().includes(cplSearch.toLowerCase())) ||
      (s.description?.toLowerCase().includes(cplSearch.toLowerCase()))
    );
  }, [cplData?.cplScores, cplSearch]);

  const radarData = useMemo(() => {
    return (cplData?.cplScores ?? []).map((sc) => ({
      subject: sc.code,
      skor: sc.score ?? 0,
      minimal: sc.minimalScore ?? 0,
      fullMark: 100,
    }));
  }, [cplData?.cplScores]);

  const cplSummary = useMemo(() => {
    const scores = cplData?.cplScores ?? [];
    if (scores.length === 0) return null;
    const passedCount = scores.filter((s) => s.passed).length;
    const totalCount = scores.length;
    const validScores = scores.filter((s) => typeof s.score === 'number') as { score: number }[];
    const avgScore = validScores.length > 0
      ? (validScores.reduce((acc, curr) => acc + curr.score, 0) / validScores.length).toFixed(1)
      : '-';

    return {
      passedCount,
      totalCount,
      avgScore,
      isAllPassed: passedCount === totalCount && totalCount > 0,
    };
  }, [cplData?.cplScores]);

  const participantCplStatus = cplData?.participantStatus ?? data?.status;
  const cplActionsEnabled = canPerformActions && participantCplStatus === 'registered';

  const handleRepairFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
  ) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setter(null);
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('File harus berformat PDF');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      event.target.value = '';
      return;
    }
    setter(file);
  };

  const clearRepairFile = (
    ref: { current: HTMLInputElement | null },
    setter: (file: File | null) => void,
  ) => {
    setter(null);
    if (ref.current) ref.current.value = '';
  };

  const cplColumns = useMemo<Column<CplScoreItem>[]>(() => {
    const cols: Column<CplScoreItem>[] = [
      {
        key: 'no',
        header: 'No',
        width: 50,
        className: 'text-center',
        render: (_, idx) => <span className="text-sm text-muted-foreground">{idx + 1}</span>
      },
      {
        key: 'code',
        header: 'Kode CPL',
        width: 100,
        render: (row) => <span className="font-medium">{row.code ?? '-'}</span>
      },
      {
        key: 'description',
        header: 'Deskripsi',
        className: 'whitespace-normal',
        render: (row) => <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{row.description}</p>
      },
      {
        key: 'score',
        header: 'Nilai',
        width: 80,
        className: 'text-center',
        render: (row) => <span className="font-semibold">{row.score ?? '-'}</span>
      },
      {
        key: 'minimalScore',
        header: 'Minimal',
        width: 80,
        className: 'text-center',
        accessor: 'minimalScore'
      },
      {
        key: 'status',
        header: 'Status',
        width: 130,
        className: 'text-center',
        render: (row) => (
          <Badge variant="outline" className={row.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
            {row.passed ? 'Lulus' : 'Belum Tercapai'}
          </Badge>
        )
      },
    ];

    cols.push({
      key: 'actions',
      header: 'Aksi',
      width: 140,
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end items-center gap-1">
          {/* Eye (view repair detail) — visible to ALL roles */}
          {(row.oldScore !== null || row.recommendationDocument) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => {
                setSelectedCpl(row);
                setViewModalOpen(true);
              }}
              title="Lihat Detail Perbaikan"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}

          {/* Validated badge — visible to ALL roles */}
          {(() => {
            const isCplValidated = row.status === 'validated' || !!row.validatedBy || !!row.validatedAt;

            return (
              <>
                {isCplValidated && (
                  <div className="flex items-center justify-center h-8 w-8" title={`Tervalidasi oleh ${row.validatedBy ?? '-'}`}>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                )}

                {cplActionsEnabled && isCplValidated && (row.recommendationDocument || row.settlementDocument) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setSelectedCpl(row);
                      setNewScore(row.score ?? row.minimalScore);
                      setRecFile(null);
                      setSetFile(null);
                      clearRepairFile(recFileInputRef, setRecFile);
                      clearRepairFile(setFileInputRef, setSetFile);
                      setRepairModalOpen(true);
                    }}
                    title="Ganti Dokumen Perbaikan"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}

                {/* Verify / Repair actions — GKM only after document verification is complete */}
                {cplActionsEnabled && !isCplValidated && (
            <>
              {row.passed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => setVerifyConfirmId(row.cplId)}
                  disabled={validateMutation.isPending}
                  title="Validasi CPL"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {!row.passed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => {
                    setSelectedCpl(row);
                    setNewScore(row.minimalScore);
                    setRecFile(null);
                    setSetFile(null);
                    clearRepairFile(recFileInputRef, setRecFile);
                    clearRepairFile(setFileInputRef, setSetFile);
                    setRepairModalOpen(true);
                  }}
                  title="Remedial / Perbaikan"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </>
      );
    })()}
  </div>
      )
    });

    return cols;
  }, [validateMutation.isPending, cplActionsEnabled]);



  if (isLoading || loadingCpl) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat detail peserta..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Data peserta tidak ditemukan.
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = PARTICIPANT_STATUS_MAP[data.status] || PARTICIPANT_STATUS_MAP.registered;
  const hasExistingRepairDocs = !!(selectedCpl?.recommendationDocument || selectedCpl?.settlementDocument);
  const hasRequiredRepairDocs =
    !!(recFile || selectedCpl?.recommendationDocument) &&
    !!(setFile || selectedCpl?.settlementDocument);
  const hasRepairChange = !hasExistingRepairDocs || !!recFile || !!setFile;

  return (
    <div className="p-6 space-y-6 max-w-full overflow-x-hidden">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(backPath)} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{toTitleCaseName(data.studentName)}</h1>
            <p className="text-muted-foreground truncate">{data.studentNim}</p>
          </div>
        </div>
        <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>
      </div>

      {/* ── ROW 1: Informasi Mahasiswa (Full-width Horizontal Card) ── */}
      <Card className="gap-4 py-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Informasi Mahasiswa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Nama Mahasiswa</p>
              <p className="text-sm font-medium mt-0.5 leading-snug">{toTitleCaseName(data.studentName)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">NIM</p>
              <p className="text-sm font-medium mt-0.5">{data.studentNim}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tanggal Pendaftaran</p>
              <p className="text-sm font-medium mt-0.5">{data.registeredAt ? formatDateId(data.registeredAt) : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status Pendaftaran</p>
              <div className="mt-1">
                <Badge variant="outline" className={statusInfo.className}>
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <p className="text-xs text-muted-foreground">Judul Tugas Akhir</p>
              <p className="text-sm font-medium mt-0.5 leading-snug">{data.thesisTitle || '-'}</p>
            </div>
            {data.supervisors && data.supervisors.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.supervisors.map((s: any, index: number) => (
                  <div key={index}>
                    <p className="text-xs text-muted-foreground">
                      {s.role ? formatRoleName(s.role) : `Dosen Pembimbing ${index + 1}`}
                    </p>
                    <p className="text-sm font-medium mt-0.5">{toTitleCaseName(s.name)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── ROW 2: Dokumen Persyaratan & Grafik CPL Mahasiswa ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Dokumen Persyaratan Card */}
        <Card className="gap-4 py-6 flex flex-col h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Dokumen Persyaratan
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {data.documents.filter((d: any) => d.status === 'approved').length} / {data.documents.length} Disetujui
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              {data.documents.map((doc: any) => {
                const isUploaded = !!doc.document?.filePath;
                const fileName = doc.document?.fileName ? truncateFileName(doc.document.fileName, 24) : 'Belum diunggah';
                const fileDate = doc.submittedAt ? formatDateShortId(doc.submittedAt) : '';

                return (
                  <div
                    key={doc.requirementId}
                    className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-card p-3.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2.5 rounded-lg shrink-0 ${
                          doc.status === 'approved'
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-600'
                            : doc.status === 'declined'
                              ? 'border border-red-200 bg-red-50 text-red-600'
                              : isUploaded
                                ? 'border border-blue-200 bg-blue-50 text-blue-600'
                                : 'border border-gray-200 bg-gray-50 text-gray-400'
                        }`}
                      >
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-sm text-foreground block truncate" title={doc.requirementName}>
                          {doc.requirementName}
                        </span>
                        <span className="text-xs text-muted-foreground block mt-0.5 truncate" title={doc.document?.fileName || 'Belum diunggah'}>
                          {fileName} {fileDate && `• ${fileDate}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={doc.status === 'approved' ? 'success' : doc.status === 'declined' ? 'destructive' : 'warning'}
                        className="rounded-md font-medium px-2.5 py-0.5 whitespace-nowrap"
                      >
                        {doc.status === 'approved' ? 'Disetujui' : doc.status === 'declined' ? 'Ditolak' : 'Menunggu'}
                      </Badge>
                      {doc.document?.filePath && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 border-gray-200 text-xs shrink-0"
                          onClick={() => openProtectedFile(doc.document.filePath, doc.document.fileName)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Lihat
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Grafik CPL Mahasiswa Card */}
        <Card className="gap-4 py-6 flex flex-col h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Grafik CPL Mahasiswa
              </span>
              {cplSummary && (
                <span className="text-xs font-normal text-muted-foreground">
                  Rata-rata: <strong className="text-foreground">{cplSummary.avgScore}</strong>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col items-center justify-between">
            {radarData.length > 0 ? (
              <div className="w-full space-y-4">
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: '#94a3b8', fontSize: 9 }}
                      />
                      <Radar
                        name="Skor Mahasiswa"
                        dataKey="skor"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.35}
                        dot={{ r: 3, fill: '#10b981' }}
                      />
                      <Radar
                        name="Batas Minimal"
                        dataKey="minimal"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.08}
                        strokeDasharray="3 3"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          borderColor: '#e2e8f0',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {cplSummary && (
                  <div className="grid grid-cols-3 gap-3 text-center pt-3 border-t border-border/60">
                    <div className="p-2.5 rounded-lg border border-gray-200 bg-card">
                      <p className="text-xs text-muted-foreground">Total CPL</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{cplSummary.totalCount}</p>
                    </div>
                    <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
                      <p className="text-xs text-emerald-800">Tercapai</p>
                      <p className="text-sm font-semibold text-emerald-700 mt-0.5">{cplSummary.passedCount}</p>
                    </div>
                    <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/50">
                      <p className="text-xs text-blue-800">Rata-Rata</p>
                      <p className="text-sm font-semibold text-blue-700 mt-0.5">{cplSummary.avgScore}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-center text-muted-foreground">
                <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium">Belum ada data nilai CPL</p>
                <p className="text-xs text-muted-foreground mt-0.5">Grafik radar akan ditampilkan setelah data CPL dimuat.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── CPL Table Section ── */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-semibold px-1">
          Capaian Pembelajaran Lulusan (CPL)
        </h2>
        <CustomTable
          columns={cplColumns}
          data={cplScores}
          loading={loadingCpl}
          isRefreshing={isFetching && !loadingCpl}
          total={cplScores.length}
          page={1}
          pageSize={100}
          onPageChange={() => { }}
          searchValue={cplSearch}
          onSearchChange={setCplSearch}
          emptyText="Tidak ada data CPL"
          actions={
            <div className="flex items-center gap-2">
              {['eligible', 'appointed', 'finalized'].includes(data?.status || '') && (
                <Button
	                  variant="outline"
	                  size="sm"
	                  className="h-9 gap-2 border-primary/40 text-primary hover:bg-primary/5 font-semibold"
	                  onClick={handleDownloadCplReport}
                >
                  <Download className="h-4 w-4" />
                  Download Hasil
                </Button>
              )}
              <RefreshButton onClick={() => refetch()} isRefreshing={isFetching && !loadingCpl} />
            </div>
          }
        />
      </div>



      {/* ── Modals ── */}

      {/* Repair Modal */}
      <Dialog open={repairModalOpen} onOpenChange={setRepairModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Perbaikan / Remedial CPL</DialogTitle>
            <DialogDescription>Masukkan nilai baru dan unggah dokumen pendukung untuk {selectedCpl?.code}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Skor Lama</Label>
                <Input value={selectedCpl?.score ?? '-'} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Skor Baru</Label>
                <Input
                  type="number"
                  min={selectedCpl?.minimalScore ?? 0}
                  max={100}
                  value={newScore}
                  onChange={(e) => setNewScore(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dokumen Rekomendasi (PDF)</Label>
              <Input
                ref={recFileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleRepairFileChange(e, setRecFile)}
              />
              <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-card p-3 min-w-0 overflow-hidden">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p
                    className="truncate text-sm font-medium text-foreground"
                    title={recFile?.name || selectedCpl?.recommendationDocument?.fileName || 'Belum ada dokumen rekomendasi'}
                  >
                    {truncateFileName(recFile?.name || selectedCpl?.recommendationDocument?.fileName, 24) || 'Belum ada dokumen rekomendasi'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {recFile
                      ? 'File baru siap diunggah saat perbaikan disimpan'
                      : selectedCpl?.recommendationDocument
                        ? 'Dokumen rekomendasi saat ini'
                        : 'Pilih file PDF maksimal 5MB'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {!recFile && selectedCpl?.recommendationDocument && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => openProtectedFile(
                        selectedCpl.recommendationDocument!.filePath,
                        selectedCpl.recommendationDocument!.fileName,
                      )}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Lihat
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => recFileInputRef.current?.click()}
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {recFile || selectedCpl?.recommendationDocument ? 'Ganti' : 'Upload'}
                  </Button>
                  {recFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => clearRepairFile(recFileInputRef, setRecFile)}
                      title="Batalkan file baru"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">* Dokumen yang berisi detail perbaikan/quiz</p>
            </div>

            <div className="space-y-2">
              <Label>Dokumen Penyelesaian (PDF)</Label>
              <Input
                ref={setFileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleRepairFileChange(e, setSetFile)}
              />
              <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-card p-3 min-w-0 overflow-hidden">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p
                    className="truncate text-sm font-medium text-foreground"
                    title={setFile?.name || selectedCpl?.settlementDocument?.fileName || 'Belum ada dokumen penyelesaian'}
                  >
                    {truncateFileName(setFile?.name || selectedCpl?.settlementDocument?.fileName, 24) || 'Belum ada dokumen penyelesaian'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {setFile
                      ? 'File baru siap diunggah saat perbaikan disimpan'
                      : selectedCpl?.settlementDocument
                        ? 'Dokumen penyelesaian saat ini'
                        : 'Pilih file PDF maksimal 5MB'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {!setFile && selectedCpl?.settlementDocument && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => openProtectedFile(
                        selectedCpl.settlementDocument!.filePath,
                        selectedCpl.settlementDocument!.fileName,
                      )}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Lihat
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setFileInputRef.current?.click()}
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {setFile || selectedCpl?.settlementDocument ? 'Ganti' : 'Upload'}
                  </Button>
                  {setFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => clearRepairFile(setFileInputRef, setSetFile)}
                      title="Batalkan file baru"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">* Jawaban atau bukti perbaikan dari mahasiswa</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepairModalOpen(false)}>Batal</Button>
            <Button
              onClick={() => {
                if (selectedCpl) {
                  repairMutation.mutate(
                    {
                      cplId: selectedCpl.cplId,
                      payload: {
                        newScore,
                        oldScore: selectedCpl.oldScore ?? selectedCpl.score ?? 0,
                        recommendation: recFile,
                        settlement: setFile
                      }
                    },
                    { onSuccess: () => setRepairModalOpen(false) },
                  );
                }
              }}
              disabled={repairMutation.isPending || !hasRequiredRepairDocs || !hasRepairChange}
            >
              {repairMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
              Simpan Perbaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-lg border-gray-200">
          <DialogHeader className="space-y-1.5 border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold px-2.5 py-0.5">
                {selectedCpl?.code}
              </Badge>
              <Badge
                variant="outline"
                className={selectedCpl?.passed
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'}
              >
                {selectedCpl?.passed ? 'Lulus' : 'Belum Tercapai'}
              </Badge>
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Detail Perbaikan CPL
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {selectedCpl?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Score Comparison Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 bg-muted/40 p-3 text-center space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                  Skor Sebelum Perbaikan
                </span>
                <span className="text-lg font-bold text-red-600 block">
                  {selectedCpl?.oldScore ?? '-'}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Minimal: {selectedCpl?.minimalScore}
                </span>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-center space-y-1">
                <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block">
                  Skor Perbaikan
                </span>
                <span className="text-lg font-bold text-emerald-700 block">
                  {selectedCpl?.score ?? '-'}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium block">
                  {selectedCpl?.passed ? '✓ Mencapai Target' : 'Belum Lulus'}
                </span>
              </div>
            </div>

            {/* Dokumen Pendukung Section */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Dokumen Pendukung Perbaikan
              </span>

              {/* Recommendation Document Card */}
              <div className="rounded-lg border border-gray-200 bg-card p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      Surat Rekomendasi
                    </p>
                    <p
                      className="text-[11px] text-muted-foreground truncate max-w-[140px] sm:max-w-[190px]"
                      title={selectedCpl?.recommendationDocument?.fileName || 'Surat Rekomendasi'}
                    >
                      {truncateFileName(selectedCpl?.recommendationDocument?.fileName, 24) || 'Surat Rekomendasi'}
                    </p>
                  </div>
                </div>

                {selectedCpl?.recommendationDocument?.filePath ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 shrink-0 text-xs font-medium border-gray-200"
                    onClick={() =>
                      openProtectedFile(
                        selectedCpl.recommendationDocument!.filePath,
                        selectedCpl.recommendationDocument!.fileName || 'Surat Rekomendasi',
                      )
                    }
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Lihat
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground italic shrink-0">Tidak ada</span>
                )}
              </div>

              {/* Settlement Document Card */}
              <div className="rounded-lg border border-gray-200 bg-card p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-xs font-semibold text-foreground truncate">
                      Bukti Penyelesaian
                    </p>
                    <p
                      className="text-[11px] text-muted-foreground truncate max-w-[140px] sm:max-w-[190px]"
                      title={selectedCpl?.settlementDocument?.fileName || 'Bukti Penyelesaian'}
                    >
                      {truncateFileName(selectedCpl?.settlementDocument?.fileName, 24) || 'Bukti Penyelesaian'}
                    </p>
                  </div>
                </div>

                {selectedCpl?.settlementDocument?.filePath ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 shrink-0 text-xs font-medium border-gray-200"
                    onClick={() =>
                      openProtectedFile(
                        selectedCpl.settlementDocument!.filePath,
                        selectedCpl.settlementDocument!.fileName || 'Bukti Penyelesaian',
                      )
                    }
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Lihat
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground italic shrink-0">Tidak ada</span>
                )}
              </div>
            </div>

            {/* Validation Audit Stamp */}
            <div className="rounded-lg border border-gray-200 bg-muted/30 p-3 space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Status Validasi: Tervalidasi</span>
              </div>
              <div className="text-xs text-muted-foreground pl-6 space-y-0.5">
                <div>
                  <span className="text-muted-foreground/80">Tervalidasi oleh:</span>{' '}
                  <span className="font-medium text-foreground">
                    {selectedCpl?.validatedBy ? toTitleCaseName(selectedCpl.validatedBy) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground/80">Waktu Validasi:</span>{' '}
                  <span className="font-medium text-foreground">
                    {selectedCpl?.validatedAt ? formatDateTimeId(selectedCpl.validatedAt) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-gray-200 pt-3">
            <Button variant="outline" size="sm" onClick={() => setViewModalOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Confirmation Dialog */}
      <AlertDialog open={!!verifyConfirmId} onOpenChange={(open) => !open && setVerifyConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verifikasi Nilai CPL?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan memverifikasi nilai CPL mahasiswa ini. Pastikan nilai sudah sesuai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (verifyConfirmId) {
                  validateMutation.mutate(verifyConfirmId, {
                    onSuccess: () => setVerifyConfirmId(null)
                  });
                }
              }}
              disabled={validateMutation.isPending}
            >
              {validateMutation.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Validasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
