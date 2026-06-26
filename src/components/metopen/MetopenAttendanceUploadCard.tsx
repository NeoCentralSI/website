import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";

import { assessmentService, type MetopenAttendancePreviewResult } from "@/services/assessment.service";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { formatDateId } from "@/lib/text";

const LATEST_ATTENDANCE_KEY = ["metopen-attendance-latest"];

function formatPercent(value?: number | null) {
  if (value == null) return "-";
  return `${(value * 100).toFixed(2)}%`;
}

export function MetopenAttendanceUploadCard() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // F-4.2: simpan hasil pratinjau + buka dialog konfirmasi yang menampilkan dampak.
  const [preview, setPreview] = useState<MetopenAttendancePreviewResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: latestImport, isLoading } = useQuery({
    queryKey: LATEST_ATTENDANCE_KEY,
    queryFn: () => assessmentService.getMetopenAttendanceLatest(),
  });

  // Langkah 1: dry-run pratinjau (tidak menulis DB) → tampilkan daftar yang akan di-auto-zero.
  const previewMutation = useMutation({
    mutationFn: (file: File) => assessmentService.previewMetopenAttendance(file),
    onSuccess: (result) => {
      setPreview(result);
      setConfirmOpen(true);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal memproses pratinjau presensi Metopel");
    },
  });

  // Langkah 2: commit upload (auto-zero permanen dijalankan di backend).
  const uploadMutation = useMutation({
    mutationFn: (file: File) => assessmentService.uploadMetopenAttendance(file),
    onSuccess: (result) => {
      toast.success(
        `Presensi Metopel diproses: ${result.totals.eligibleRows} eligible, ${result.totals.ineligibleRows} tidak eligible, ${result.totals.autoZeroedCount} di-auto-zero.`,
      );
      setSelectedFile(null);
      setPreview(null);
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
    onError: (err: Error) => {
      toast.error(err.message || "Gagal mengunggah presensi Metopel");
    },
  });

  const handlePreview = () => {
    if (!selectedFile) {
      toast.error("Pilih file XLSX presensi Metopel terlebih dahulu");
      return;
    }
    previewMutation.mutate(selectedFile);
  };

  const handleConfirmUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  const isBusy = previewMutation.isPending || uploadMutation.isPending;

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
              Unggah report peserta kelas Metode Penelitian untuk membuka penilaian TA-03A/TA-03B. Minimal presensi 75%.
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
              <p className="text-xs text-muted-foreground">Threshold</p>
              <p className="font-medium">{formatPercent(latestImport.thresholdPercent)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Matched</p>
              <p className="font-medium">{latestImport.matchedRows} / {latestImport.totalRows}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Eligible</p>
              <p className="font-medium text-emerald-700">{latestImport.eligibleRows}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Kurang 75%</p>
              <p className="font-medium text-destructive">{latestImport.ineligibleRows}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Auto-zero</p>
              <p className="font-medium">{latestImport.autoZeroedCount}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="metopen-attendance-file">File presensi XLSX/XLS</Label>
            <Input
              ref={inputRef}
              id="metopen-attendance-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
          </div>
          {/* F-4.2: pratinjau dulu (dry-run) sebelum commit — auto-zero <75% PERMANEN (canon §5.7.3). */}
          <Button disabled={!selectedFile || isBusy} onClick={handlePreview}>
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

      {/* F-4.2: dialog konfirmasi menampilkan DAMPAK auto-zero permanen sebelum commit. */}
      <AlertDialog open={confirmOpen} onOpenChange={(open) => !uploadMutation.isPending && setConfirmOpen(open)}>
        <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Konfirmasi proses presensi &amp; auto-zero permanen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Pratinjau di bawah belum mengubah data apa pun. Mahasiswa dengan presensi{" "}
              <strong>&lt;75%</strong> akan mendapat nilai TA-03 = <strong>0 secara permanen</strong>{" "}
              (canon §5.7.3 — tidak dapat dibatalkan walau presensi diperbaiki kemudian).
            </AlertDialogDescription>
          </AlertDialogHeader>

          {preview && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/20 p-3 sm:grid-cols-4">
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
                  <p className="text-xs text-muted-foreground">Akan di-auto-zero</p>
                  <p className="font-medium text-destructive">{preview.totals.willAutoZeroCount}</p>
                </div>
              </div>

              {preview.willAutoZero.length > 0 ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <p className="mb-1.5 text-xs font-semibold text-destructive">
                    {preview.willAutoZero.length} mahasiswa akan di-auto-zero PERMANEN:
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
                  Tidak ada mahasiswa yang akan di-auto-zero dari file ini.
                </p>
              )}

              {preview.totals.willSkipFinalizedCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {preview.totals.willSkipFinalizedCount} mahasiswa dilewati (nilai TA-03 sudah final, BR-21).
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
