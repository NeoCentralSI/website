import { useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";

import {
  assessmentService,
  type MetopenAttendanceApiError,
  type MetopenAttendanceNimConflict,
  type MetopenAttendancePreviewResult,
} from "@/services/assessment.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricAction } from "@/components/metopen/MetricAction";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useActiveAcademicYear } from "@/hooks/shared/useActiveAcademicYear";
import { formatDateId } from "@/lib/text";

const LATEST_ATTENDANCE_KEY = ["metopen-attendance-latest"] as const;
const MAX_ATTENDANCE_FILES = 2;

function formatPercent(value?: number | null) {
  if (value == null) return "-";
  return `${(value * 100).toFixed(2)}%`;
}

export function MetopenAttendanceUploadCard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<MetopenAttendancePreviewResult | null>(null);
  const [conflicts, setConflicts] = useState<MetopenAttendanceNimConflict[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const {
    academicYear,
    label: academicYearLabel,
    isLoading: isAcademicYearLoading,
    error: academicYearError,
  } = useActiveAcademicYear();
  const academicYearId = academicYear?.id ?? null;

  const { data: latestImport, isLoading: isLatestLoading } = useQuery({
    queryKey: [...LATEST_ATTENDANCE_KEY, academicYearId],
    queryFn: () => assessmentService.getMetopenAttendanceLatest(academicYearId!),
    enabled: Boolean(academicYearId),
  });

  const previewMutation = useMutation({
    mutationFn: (files: File[]) => {
      if (!academicYearId) throw new Error("Periode akademik aktif belum tersedia");
      return assessmentService.previewMetopenAttendance(files, academicYearId);
    },
    onSuccess: (result) => {
      setConflicts([]);
      setPreview(result);
      setConfirmOpen(true);
    },
    onError: (err: MetopenAttendanceApiError) => {
      const conflictList = err.details?.conflicts ?? [];
      if (conflictList.length > 0) {
        setConflicts(conflictList);
        setConflictOpen(true);
        setPreview(null);
        return;
      }
      toast.error(err.message || "Gagal memproses pratinjau presensi Metopel");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => {
      if (!academicYearId) throw new Error("Periode akademik aktif belum tersedia");
      return assessmentService.uploadMetopenAttendance(files, academicYearId);
    },
    onSuccess: (result) => {
      const fileLabel = result.totals.sourceFileCount && result.totals.sourceFileCount > 1
        ? `${result.totals.sourceFileCount} file digabung`
        : "1 file";
      toast.success(
        `Presensi Metopel diproses (${fileLabel}): ${result.totals.eligibleRows} eligible, ${result.totals.ineligibleRows} tidak eligible, ${result.totals.autoZeroedCount} di-auto-zero.`,
      );
      setSelectedFiles([]);
      setPreview(null);
      setConflicts([]);
      setConfirmOpen(false);
      if (inputRef.current) inputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: LATEST_ATTENDANCE_KEY });
      queryClient.invalidateQueries({ queryKey: ["assessment-attendance-eligibility"] });
      queryClient.invalidateQueries({ queryKey: ["assessment-metopen-queue"] });
      queryClient.invalidateQueries({ queryKey: ["assessment-metopen-history"] });
      queryClient.invalidateQueries({ queryKey: ["supervisor-scoring-queue"] });
      queryClient.invalidateQueries({ queryKey: ["assessment-supervisor-queue"] });
      queryClient.invalidateQueries({ queryKey: ["assessment-supervisor-history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kadep-title-reports"] });
    },
    onError: (err: MetopenAttendanceApiError) => {
      const conflictList = err.details?.conflicts ?? [];
      if (conflictList.length > 0) {
        setConfirmOpen(false);
        setConflicts(conflictList);
        setConflictOpen(true);
        return;
      }
      toast.error(err.message || "Gagal mengunggah presensi Metopel");
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Array.from(event.target.files ?? []);
    if (next.length > MAX_ATTENDANCE_FILES) {
      toast.error(`Maksimal ${MAX_ATTENDANCE_FILES} file kelas Metopel per unggahan`);
      if (inputRef.current) inputRef.current.value = "";
      setSelectedFiles([]);
      return;
    }
    setSelectedFiles(next);
    setConflicts([]);
  };

  const handlePreview = () => {
    if (!academicYearId) {
      toast.error("Periode akademik aktif belum tersedia");
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error("Pilih 1–2 file XLSX/XLS presensi Metopel terlebih dahulu");
      return;
    }
    previewMutation.mutate(selectedFiles);
  };

  const handleConfirmUpload = () => {
    if (selectedFiles.length === 0) return;
    uploadMutation.mutate(selectedFiles);
  };

  const isBusy = previewMutation.isPending || uploadMutation.isPending;
  const isLoading = isAcademicYearLoading || isLatestLoading;
  const sourceFileCount = latestImport?.sourceFiles?.length
    ?? (latestImport?.classCode?.includes(" + ") ? 2 : latestImport ? 1 : 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Presensi Metopel
            </CardTitle>
            <CardDescription>
              Unggah 1–2 report peserta kelas Metode Penelitian. Minimal presensi 75%. Unggah ulang mengganti data aktif.
            </CardDescription>
          </div>
          {latestImport ? (
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Tersedia
            </Badge>
          ) : (
            <Badge variant="outline">Belum ada</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {academicYearError || (!academicYear && !isAcademicYearLoading) ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Periode akademik aktif tidak tersedia</AlertTitle>
            <AlertDescription>
              Presensi tidak dapat diproses sebelum rentang periode akademik aktif dikonfigurasi.
            </AlertDescription>
          </Alert>
        ) : null}

        {!latestImport && !isLoading ? (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <AlertTitle className="text-amber-900">Penilaian dikunci sampai presensi diunggah</AlertTitle>
            <AlertDescription className="text-amber-800">
              Mahasiswa yang tidak mencapai 75% akan langsung mendapat nilai TA-03 = 0 tanpa review proposal.
            </AlertDescription>
          </Alert>
        ) : null}

        {latestImport ? (
          <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Periode</p>
              <p className="font-medium">{academicYearLabel || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Kelas</p>
              <p className="font-medium">{latestImport.classCode || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Semester</p>
              <p className="font-medium">{latestImport.semesterLabel || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Diunggah</p>
              <p className="font-medium">{formatDateId(latestImport.uploadedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">File sumber</p>
              <p className="font-medium">{sourceFileCount || 1}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Threshold</p>
              <p className="font-medium">{formatPercent(latestImport.thresholdPercent)}</p>
            </div>
            <MetricAction
              label="Matched"
              value={`${latestImport.matchedRows} / ${latestImport.totalRows}`}
              className="min-h-0 p-2"
              onClick={() => navigate("/kelola/metopen/monitoring?import=in_import")}
            />
            <MetricAction
              label="Eligible"
              value={latestImport.eligibleRows}
              tone="emerald"
              className="min-h-0 p-2"
              onClick={() => navigate("/kelola/metopen/monitoring?attendance=eligible")}
            />
            <MetricAction
              label="Kurang 75%"
              value={latestImport.ineligibleRows}
              tone="rose"
              className="min-h-0 p-2"
              onClick={() => navigate("/kelola/metopen/monitoring?attendance=ineligible")}
            />
            <MetricAction
              label="Nilai otomatis 0"
              value={latestImport.autoZeroedCount}
              tone="rose"
              className="min-h-0 p-2"
              onClick={() => navigate("/kelola/metopen/monitoring?score=auto_zero")}
            />
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="metopen-attendance-file">File presensi XLSX/XLS (1–2 kelas)</Label>
            <Input
              ref={inputRef}
              id="metopen-attendance-file"
              type="file"
              accept=".xlsx,.xls"
              multiple
              disabled={!academicYearId || isBusy}
              onChange={handleFileChange}
            />
            {selectedFiles.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Dipilih: {selectedFiles.map((file) => file.name).join(", ")}
              </p>
            ) : null}
          </div>
          <Button
            disabled={selectedFiles.length === 0 || !academicYearId || isBusy}
            onClick={handlePreview}
          >
            {previewMutation.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Memeriksa...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Tinjau &amp; Unggah
              </>
            )}
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              NIM bentrok antar file kelas
            </AlertDialogTitle>
            <AlertDialogDescription>
              Unggah ditolak. NIM yang sama tidak boleh muncul di dua file kelas sekaligus.
              Sistem tidak memilih persentase secara otomatis. Perbaiki data SIA lalu unggah ulang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="max-h-56 space-y-2 overflow-y-auto text-xs">
            {conflicts.map((conflict) => (
              <li key={conflict.identityNumber} className="rounded-md border p-2">
                <p className="font-medium">
                  {conflict.studentName || "-"}{" "}
                  <span className="text-muted-foreground">({conflict.identityNumber})</span>
                </p>
                <ul className="mt-1 space-y-0.5 text-muted-foreground">
                  {conflict.sources.map((source, index) => (
                    <li key={`${conflict.identityNumber}-${index}`}>
                      {source.fileName || "file"}{source.classCode ? ` · ${source.classCode}` : ""} ·{" "}
                      {formatPercent(source.attendancePercentage)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setConflictOpen(false)}>Mengerti</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !uploadMutation.isPending && setConfirmOpen(open)}>
        <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Konfirmasi proses presensi &amp; nilai otomatis 0 permanen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Pratinjau di bawah belum mengubah data apa pun. Mahasiswa dengan presensi{" "}
              <strong>kurang dari 75%</strong> akan mendapat nilai TA-03 = <strong>0 secara permanen</strong>
              {selectedFiles.length > 1
                ? " setelah kedua file digabung menjadi satu import aktif."
                : "."}{" "}
              Unggah ulang berikutnya mengganti seluruh set aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {preview && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/20 p-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">File digabung</p>
                  <p className="font-medium">{preview.totals.sourceFileCount ?? selectedFiles.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total baris</p>
                  <p className="font-medium">{preview.totals.totalRows}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cocok mahasiswa</p>
                  <p className="font-medium">{preview.totals.matchedRows}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Eligible (≥75%)</p>
                  <p className="font-medium text-emerald-700">{preview.totals.eligibleRows}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Akan dinilai otomatis 0</p>
                  <p className="font-medium text-destructive">{preview.totals.willAutoZeroCount}</p>
                </div>
              </div>

              {preview.sourceFiles && preview.sourceFiles.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Sumber:{" "}
                  {preview.sourceFiles
                    .map((file) => `${file.originalName || "file"}${file.classCode ? ` (${file.classCode})` : ""}`)
                    .join("; ")}
                </p>
              ) : null}

              {preview.willAutoZero.length > 0 ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <p className="mb-1.5 text-xs font-semibold text-destructive">
                    {preview.willAutoZero.length} mahasiswa akan dinilai otomatis 0 PERMANEN:
                  </p>
                  <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
                    {preview.willAutoZero.map((s) => (
                      <li key={s.identityNumber} className="flex justify-between gap-2">
                        <span className="truncate">
                          {s.studentName || "-"} <span className="text-muted-foreground">({s.identityNumber})</span>
                        </span>
                        <span className="shrink-0 font-medium text-destructive">{formatPercent(s.attendancePercentage)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  Tidak ada mahasiswa yang akan dinilai otomatis 0 dari unggahan ini.
                </p>
              )}

              {preview.totals.willSkipFinalizedCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {preview.totals.willSkipFinalizedCount} mahasiswa dilewati karena nilai TA-03 sudah final.
                </p>
              )}
              {preview.totals.unmatchedRows > 0 && (
                <p className="text-xs text-muted-foreground">
                  {preview.totals.unmatchedRows} baris tidak cocok dengan mahasiswa terdaftar (diabaikan).
                </p>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={uploadMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleConfirmUpload();
              }}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Memproses...
                </>
              ) : (
                "Ya, Proses Presensi"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
